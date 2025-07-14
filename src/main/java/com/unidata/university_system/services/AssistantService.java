package com.unidata.university_system.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.select.Select;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    @Value("${gigachat.api.oauth-url}")
    private String oauthUrl;

    @Value("${gigachat.api.url}")
    private String gigaChatApiUrl;

    @Value("${gigachat.api.key}")
    private String authorizationKey;

    @Value("${gigachat.api.scope}")
    private String scope;

    private String accessToken;
    private long expiresAt = 0;
    private final ReentrantLock tokenLock = new ReentrantLock();
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AssistantService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
    }

    private void refreshTokenIfNeeded() {
        long now = Instant.now().getEpochSecond();
        if (accessToken == null || now >= expiresAt) {
            tokenLock.lock();
            try {
                if (accessToken == null || now >= expiresAt) {
                    RestTemplate restTemplate = new RestTemplate();
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
                    headers.set("Authorization", "Basic " + authorizationKey);
                    headers.set("RqUID", UUID.randomUUID().toString());
                    String body = "scope=" + scope;
                    HttpEntity<String> entity = new HttpEntity<>(body, headers);
                    logger.info("OAuth Request: URL={}, Headers={}, Body={}", oauthUrl, headers, body);
                    ResponseEntity<Map> response = restTemplate.postForEntity(oauthUrl, entity, Map.class);
                    logger.info("OAuth Response: Status={}, Body={}", response.getStatusCode(), response.getBody());
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        accessToken = (String) response.getBody().get("access_token");
                        Object expiresAtObj = response.getBody().get("expires_at");
                        if (expiresAtObj instanceof Number) {
                            expiresAt = ((Number) expiresAtObj).longValue() / 1000 - 10;
                        } else {
                            expiresAt = now + 1700;
                        }
                    } else {
                        throw new RuntimeException("Не удалось получить access token GigaChat: " + response);
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to refresh GigaChat token: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to refresh GigaChat token: " + e.getMessage(), e);
            } finally {
                tokenLock.unlock();
            }
        }
    }

    private boolean isSelectQuery(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            return false;
        }
        try {
            return CCJSqlParserUtil.parse(sql) instanceof Select;
        } catch (Exception e) {
            logger.error("Failed to parse SQL: {}", e.getMessage());
            return false;
        }
    }

    public Map<String, Object> processQuery(String userQuery) {
        try {
            refreshTokenIfNeeded();

            // Промпт для генерации SQL
            String prompt = "Ты — эксперт по SQL и базе данных PostgreSQL. Твоя задача — преобразовать пользовательский запрос в SQL-запрос, используя ТОЛЬКО указанные таблицы и их столбцы. Если запрашиваемая информация отсутствует в базе данных, верни SQL-запрос для наиболее релевантных данных и добавь комментарий, объясняющий, что именно ты не можешь предоставить и какие данные возвращаются вместо этого. Если данные слишком далеки от запроса, не генерируй SQL-запрос, а верни только комментарий, сообщающий, что информация недоступна. Формат ответа должен быть JSON: `{ \"sql\": \"<SQL-запрос>\", \"comment\": \"<объяснение>\" }`. Возвращай ТОЛЬКО JSON без дополнительных пояснений и без обратных кавычек (```).\n" +
                    "\n" +
                    "Используй следующие таблицы и их столбцы:\n" +
                    "- region (id, name)\n" +
                    "- city (id, name, region_id)\n" +
                    "- university (id, short_name, full_name, type, avg_ege_score, country_ranking, city_id)\n" +
                    "- faculty (id, name, university_id)\n" +
                    "- specialty (id, name, program_code, description, faculty_id)\n" +
                    "- subject (id, name)\n" +
                    "- subject_combination (id, specialty_id)\n" +
                    "- required_subject (combination_id, subject_id)\n" +
                    "\n" +
                    "Ограничения:\n" +
                    "- Минимальные баллы ЕГЭ по отдельным предметам НЕ хранятся в базе. Единственный столбец, связанный с баллами, — university.avg_ege_score, который отражает средний проходной балл для вуза в целом.\n" +
                    "- Генерируй ТОЛЬКО SELECT-запросы. Другие типы запросов (INSERT, UPDATE, DELETE и т.д.) запрещены.\n" +
                    "- Используй ТОЛЬКО указанные таблицы и столбцы. Не предполагай наличие других таблиц или столбцов (например, min_score).\n" +
                    "- Если запрос не может быть выполнен из-за отсутствия данных, верни JSON с пустым полем sql (\"sql\": \"\") и пояснением в comment.\n" +
                    "- Если запрос требует уточнения (например, конкретной специальности), возвращай данные для всех подходящих записей и укажи это в comment.\n" +
                    "- Убедись, что SQL-запрос синтаксически корректен для PostgreSQL и использует правильные псевдонимы таблиц.\n" +
                    "\n" +
                    "Примеры:\n" +
                    "1. Запрос: \"вузы в Москве\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT u.*, c.name AS city_name FROM university u JOIN city c ON u.city_id = c.id WHERE c.name = 'Москва'\",\n" +
                    "  \"comment\": \"Возвращены все вузы в Москве с их характеристиками.\"\n" +
                    "}\n" +
                    "\n" +
                    "2. Запрос: \"программы с математикой и физикой\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT s.* FROM specialty s JOIN subject_combination sc ON s.id = sc.specialty_id JOIN required_subject rs ON sc.id = rs.combination_id JOIN subject sub ON rs.subject_id = sub.id WHERE sub.name IN ('математика', 'физика') GROUP BY s.id HAVING COUNT(DISTINCT sub.name) = 2\",\n" +
                    "  \"comment\": \"Возвращены специальности, требующие сдачи математики и физики.\"\n" +
                    "}\n" +
                    "\n" +
                    "3. Запрос: \"регионы с вузами\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT DISTINCT r.* FROM region r JOIN city c ON r.id = c.region_id JOIN university u ON c.id = u.city_id\",\n" +
                    "  \"comment\": \"Возвращены регионы, в которых есть вузы.\"\n" +
                    "}\n" +
                    "\n" +
                    "4. Запрос: \"специальности в МГУ\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT s.* FROM specialty s JOIN faculty f ON s.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'МГУ'\",\n" +
                    "  \"comment\": \"Возвращены все специальности в МГУ.\"\n" +
                    "}\n" +
                    "\n" +
                    "5. Запрос: \"Какие предметы нужно сдавать на ЕГЭ для поступления в ВШЭ и какие баллы?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT DISTINCT sub.name AS subject_name, u.avg_ege_score FROM subject sub JOIN required_subject rs ON sub.id = rs.subject_id JOIN subject_combination sc ON rs.combination_id = sc.id JOIN specialty sp ON sc.specialty_id = sp.id JOIN faculty f ON sp.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'ВШЭ' ORDER BY sub.name\",\n" +
                    "  \"comment\": \"Минимальные баллы по предметам не хранятся в базе. Возвращены предметы, необходимые для поступления в ВШЭ, и средний проходной балл вуза.\"\n" +
                    "}\n" +
                    "\n" +
                    "6. Запрос: \"Какие минимальные баллы нужно набрать по предметам чтобы поступить в ВШЭ?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT DISTINCT sub.name AS subject_name, u.avg_ege_score FROM subject sub JOIN required_subject rs ON sub.id = rs.subject_id JOIN subject_combination sc ON rs.combination_id = sc.id JOIN specialty sp ON sc.specialty_id = sp.id JOIN faculty f ON sp.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'ВШЭ' ORDER BY sub.name\",\n" +
                    "  \"comment\": \"Минимальные баллы по предметам не хранятся в базе. Вместо этого возвращены предметы, необходимые для поступления в ВШЭ, и средний проходной балл вуза.\"\n" +
                    "}\n" +
                    "\n" +
                    "7. Запрос: \"Проходной балл в МГУ\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT u.short_name, u.avg_ege_score FROM university u WHERE u.short_name = 'МГУ'\",\n" +
                    "  \"comment\": \"Возвращен средний проходной балл для МГУ. Минимальные баллы по предметам не хранятся в базе.\"\n" +
                    "}\n" +
                    "\n" +
                    "8. Запрос: \"Какие преподаватели в ВШЭ?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"\",\n" +
                    "  \"comment\": \"Информация о преподавателях отсутствует в базе данных. Доступны данные о вузах, специальностях, предметах и средних проходных баллах.\"\n" +
                    "}\n" +
                    "\n" +
                    "9. Запрос: \"Вузы с проходным баллом выше 80\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT u.short_name, u.full_name, u.avg_ege_score FROM university u WHERE u.avg_ege_score > 80\",\n" +
                    "  \"comment\": \"Возвращены вузы с средним проходным баллом выше 80.\"\n" +
                    "}\n" +
                    "\n" +
                    "10. Запрос: \"Сколько студентов учится в ВШЭ?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"\",\n" +
                    "  \"comment\": \"Информация о количестве студентов отсутствует в базе данных. Доступны данные о вузах, специальностях, предметах и средних проходных баллах.\"\n" +
                    "}\n" +
                    "\n" +
                    "Верни ответ в формате JSON: `{ \"sql\": \"<SQL-запрос>\", \"comment\": \"<объяснение>\" }`. Убедись, что SQL-запрос использует только указанные таблицы и столбцы, является корректным для PostgreSQL и содержит только SELECT. Если данные недоступны, верни пустой sql и пояснение в comment.\n" +
                    "\n" +
                    "Пользовательский запрос: " + userQuery;

            // Формирование JSON с помощью ObjectMapper
            Map<String, Object> requestBodyMap = new HashMap<>();
            requestBodyMap.put("model", "GigaChat-Pro");
            requestBodyMap.put("messages", Collections.singletonList(
                    Map.of("role", "user", "content", prompt)
            ));
            String requestBody = objectMapper.writeValueAsString(requestBodyMap);

            // Запрос к GigaChat API
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            logger.info("GigaChat Request: URL={}, Headers={}, Body={}", gigaChatApiUrl, headers, requestBody);
            ResponseEntity<Map> response = restTemplate.postForEntity(gigaChatApiUrl, entity, Map.class);
            logger.info("GigaChat Response: Status={}, Body={}", response.getStatusCode(), response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return Map.of("status", "error", "message", "Ошибка GigaChat: " + response.getStatusCode());
            }

            // Извлечение SQL и комментария из ответа GigaChat
            Map<String, String> gigaChatResponse = extractSqlAndCommentFromResponse(response.getBody());
            String sqlQuery = gigaChatResponse.get("sql");
            String comment = gigaChatResponse.get("comment");

            // Логирование ответа GigaChat
            logger.info("GigaChat Response Parsed: sql={}, comment={}", sqlQuery, comment);

            // Если SQL-запрос пустой, возвращаем комментарий как сообщение
            if (sqlQuery == null || sqlQuery.trim().isEmpty()) {
                return Map.of("status", "error", "message", comment);
            }

            // Проверка, что запрос является SELECT
            if (!isSelectQuery(sqlQuery)) {
                return Map.of("status", "error", "message", "Ошибка: только SELECT-запросы разрешены.", "comment", comment);
            }

            // Выполнение SQL-запроса
            try {
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sqlQuery);
                if (results.isEmpty()) {
                    return Map.of("status", "error", "message", "Извините, информация по вашему запросу отсутствует.", "comment", comment);
                }
                return Map.of("status", "success", "data", results, "comment", comment);
            } catch (Exception e) {
                logger.error("SQL execution error: {}", e.getMessage(), e);
                return Map.of("status", "error", "message", "Ошибка выполнения SQL-запроса: " + e.getMessage(), "comment", comment);
            }
        } catch (Exception e) {
            logger.error("GigaChat error: {}", e.getMessage(), e);
            return Map.of("status", "error", "message", "Ошибка обращения к GigaChat: " + e.getMessage());
        }
    }

    private Map<String, String> extractSqlAndCommentFromResponse(Map response) {
        try {
            List<Map> choices = (List<Map>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map message = (Map) choices.get(0).get("message");
                if (message != null) {
                    String content = (String) message.get("content");
                    // Парсим JSON-ответ
                    Map<String, String> result = objectMapper.readValue(content, Map.class);
                    return result;
                }
            }
            return Map.of("sql", "", "comment", "Ошибка: не удалось извлечь SQL или комментарий из ответа GigaChat.");
        } catch (Exception e) {
            logger.error("Ошибка извлечения SQL и комментария: {}", e.getMessage());
            return Map.of("sql", "", "comment", "Ошибка: не удалось извлечь SQL или комментарий из ответа GigaChat.");
        }
    }
}