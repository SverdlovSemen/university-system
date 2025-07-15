package com.unidata.university_system.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unidata.university_system.dto.gigachat.Message;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.select.Select;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    // Системный промпт
    private static final String SYSTEM_PROMPT =
            "Ты — эксперт по SQL и базе данных PostgreSQL. Твоя задача — преобразовать пользовательский запрос в SQL-запрос, используя ТОЛЬКО указанные таблицы и их столбцы. Учитывай историю сообщений, чтобы понять контекст запроса (например, если пользователь пишет 'туда', определи, о каком вузе или специальности идет речь, на основе предыдущих сообщений). Если запрашиваемая информация отсутствует в базе данных, верни SQL-запрос для наиболее релевантных данных и добавь комментарий, объясняющий, что именно ты не можешь предоставить и какие данные возвращаются вместо этого. Если данные слишком далеки от запроса или запрос не может быть выполнен, верни JSON с пустым полем sql (\"sql\": \"\") и пояснением в comment. Формат ответа должен быть ТОЛЬКО JSON: { \"sql\": \"<SQL-запрос>\", \"comment\": \"<объяснение>\" }. Возвращай ТОЛЬКО JSON без дополнительных пояснений и без обратных кавычек (```).\n" +
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
                    "- Генерируй ТОЛЬКО SELECT-запросы. Другие типы запросов (INSERT, UPDATE, DELETE и т.д.) строго запрещены.\n" +
                    "- Используй ТОЛЬКО указанные таблицы и столбцы. Не предполагай наличие других таблиц или столбцов (например, min_score).\n" +
                    "- Убедись, что SQL-запрос синтаксически корректен для PostgreSQL, использует правильные псевдонимы таблиц и возвращает релевантные данные.\n" +
                    "- Если запрос неоднозначен (например, не указана конкретная специальность или вуз), проанализируй историю сообщений, чтобы определить контекст. Если контекст не ясен, верни JSON с пустым sql и пояснением в comment, указав, что требуется уточнение.\n" +
                    "- Если данные недоступны, верни JSON с пустым sql и пояснением в comment.\n" +
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
                    "3. Запрос: \"Какие факультеты в АлтГУ?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT f.* FROM faculty f JOIN university u ON f.university_id = u.id WHERE u.short_name = 'АлтГУ'\",\n" +
                    "  \"comment\": \"Возвращены все факультеты в АлтГУ.\"\n" +
                    "}\n" +
                    "\n" +
                    "4. Запрос (после предыдущего): \"А на какие баллы нужно сдать ЕГЭ чтобы поступить туда?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"SELECT DISTINCT sub.name AS subject_name, u.avg_ege_score FROM subject sub JOIN required_subject rs ON sub.id = rs.subject_id JOIN subject_combination sc ON rs.combination_id = sc.id JOIN specialty sp ON sc.specialty_id = sp.id JOIN faculty f ON sp.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'АлтГУ' ORDER BY sub.name\",\n" +
                    "  \"comment\": \"Минимальные баллы по предметам не хранятся в базе. Возвращены предметы, необходимые для поступления в АлтГУ, и средний проходной балл вуза.\"\n" +
                    "}\n" +
                    "\n" +
                    "5. Запрос: \"Какие преподаватели в ВШЭ?\" → \n" +
                    "{\n" +
                    "  \"sql\": \"\",\n" +
                    "  \"comment\": \"Информация о преподавателях отсутствует в базе данных. Доступны данные о вузах, специальностях, предметах и средних проходных баллах.\"\n" +
                    "}\n" +
                    "\n" +
                    "Верни ответ в формате JSON: { \"sql\": \"<SQL-запрос>\", \"comment\": \"<объяснение>\" }. Убедись, что ответ содержит только JSON, без лишних символов, обратных кавычек или пояснений. Если контекст из истории сообщений указывает на конкретный вуз, специальность или другой объект, используй его в SQL-запросе.";

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
    private final RestTemplate restTemplate;

    public AssistantService(JdbcTemplate jdbcTemplate, RestTemplate restTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public Map<String, Object> queryGigaChat(List<Message> messages, String model, String jwtToken) {
        try {
            // Проверка корректности модели
            if (model == null || !List.of("GigaChat-2-Pro", "GigaChat-2-Max", "GigaChat-2").contains(model)) {
                logger.warn("Invalid model: {}. Defaulting to GigaChat-Pro", model);
                model = "GigaChat-2-Pro";
            }

            // Проверка входных данных
            if (messages == null || messages.isEmpty()) {
                logger.error("Messages list is null or empty");
                return Map.of("status", "error", "message", "Список сообщений пуст или отсутствует");
            }

            // Добавляем системное сообщение в начало
            List<Message> requestMessages = new ArrayList<>();
            requestMessages.add(new Message("system", SYSTEM_PROMPT));
            requestMessages.addAll(messages);

            // Обновляем токен, если нужно
            refreshTokenIfNeeded();

            // Формирование JSON для GigaChat API
            Map<String, Object> requestBodyMap = new HashMap<>();
            requestBodyMap.put("model", model);
            requestBodyMap.put("messages", requestMessages);

            String requestBody = objectMapper.writeValueAsString(requestBodyMap);

            // Запрос к GigaChat API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            logger.info("GigaChat Request: URL={}, Headers={}, Body={}", gigaChatApiUrl, headers, requestBody);

            ResponseEntity<Map> response;
            try {
                response = restTemplate.postForEntity(gigaChatApiUrl, entity, Map.class);
            } catch (RestClientException e) {
                logger.error("GigaChat API request failed: {}", e.getMessage(), e);
                return Map.of("status", "error", "message", "Ошибка обращения к GigaChat API: " + e.getMessage());
            }

            logger.info("GigaChat Response: Status={}, Body={}", response.getStatusCode(), response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                logger.error("GigaChat API returned non-success status: {}", response.getStatusCode());
                return Map.of("status", "error", "message", "Ошибка GigaChat: " + response.getStatusCode());
            }

            // Извлечение SQL и комментария из ответа
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
                logger.error("Invalid SQL query: only SELECT queries are allowed: {}", sqlQuery);
                return Map.of("status", "error", "message", "Ошибка: только SELECT-запросы разрешены.", "comment", comment);
            }

            // Выполнение SQL-запроса
            try {
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sqlQuery);
                if (results.isEmpty()) {
                    logger.warn("SQL query returned no results: {}", sqlQuery);
                    return Map.of("status", "error", "message", "Извините, информация по вашему запросу отсутствует.", "comment", comment);
                }
                return Map.of("status", "success", "data", results, "comment", comment);
            } catch (Exception e) {
                logger.error("SQL execution error: {}", e.getMessage(), e);
                return Map.of("status", "error", "message", "Ошибка выполнения SQL-запроса: " + e.getMessage(), "comment", comment);
            }
        } catch (Exception e) {
            logger.error("Unexpected error in queryGigaChat: {}", e.getMessage(), e);
            return Map.of("status", "error", "message", "Неожиданная ошибка при обращении к GigaChat: " + e.getMessage());
        }
    }

    private void refreshTokenIfNeeded() {
        long now = Instant.now().getEpochSecond();
        if (accessToken == null || now >= expiresAt) {
            tokenLock.lock();
            try {
                if (accessToken == null || now >= expiresAt) {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
                    headers.set("Authorization", "Basic " + authorizationKey);
                    headers.set("RqUID", UUID.randomUUID().toString());
                    String body = "scope=" + scope;
                    HttpEntity<String> entity = new HttpEntity<>(body, headers);
                    logger.info("OAuth Request: URL={}, Headers={}, Body={}", oauthUrl, headers, body);

                    ResponseEntity<Map> response;
                    try {
                        response = restTemplate.postForEntity(oauthUrl, entity, Map.class);
                    } catch (RestClientException e) {
                        logger.error("OAuth request failed: {}", e.getMessage(), e);
                        throw new RuntimeException("Не удалось получить access token GigaChat: " + e.getMessage(), e);
                    }

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
                        logger.error("OAuth response invalid: {}", response);
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
            logger.warn("SQL query is null or empty");
            return false;
        }
        try {
            return CCJSqlParserUtil.parse(sql) instanceof Select;
        } catch (Exception e) {
            logger.error("Failed to parse SQL: {}", e.getMessage());
            return false;
        }
    }

    private Map<String, String> extractSqlAndCommentFromResponse(Map response) {
        try {
            List<Map> choices = (List<Map>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                logger.error("GigaChat response has no choices");
                return Map.of("sql", "", "comment", "Ошибка: ответ GigaChat не содержит данных.");
            }

            Map message = (Map) choices.get(0).get("message");
            if (message == null) {
                logger.error("GigaChat response has no message");
                return Map.of("sql", "", "comment", "Ошибка: ответ GigaChat не содержит сообщения.");
            }

            String content = (String) message.get("content");
            if (content == null || content.trim().isEmpty()) {
                logger.error("GigaChat response content is null or empty");
                return Map.of("sql", "", "comment", "Ошибка: ответ GigaChat пустой.");
            }

            // Удаляем лишние ```json ... ``` или ```, если они есть
            String cleanedContent = content.replaceAll("^```json\\n|\\n```$|^```|\\n```$", "").trim();
            // Парсим JSON-ответ
            Map<String, String> result = objectMapper.readValue(cleanedContent, Map.class);
            return result;
        } catch (Exception e) {
            logger.error("Ошибка извлечения SQL и комментария: {}", e.getMessage(), e);
            return Map.of("sql", "", "comment", "Ошибка: не удалось извлечь SQL или комментарий из ответа GigaChat: " + e.getMessage());
        }
    }
}