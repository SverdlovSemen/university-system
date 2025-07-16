package com.unidata.university_system.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unidata.university_system.dto.gigachat.Message;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    // Updated SYSTEM_PROMPT with restricted tables and username context
    private static final String SYSTEM_PROMPT = """
        Ты — эксперт по SQL и базе данных PostgreSQL. Твоя задача — преобразовать пользовательский запрос в SQL-запрос, используя ТОЛЬКО указанные таблицы и их столбцы. Текущий пользователь: {username}. Для запросов вроде 'мои избранные вузы' или 'мои избранные специальности' используй username = '{username}' в SQL-запросах для фильтрации по текущему пользователю. Учитывай историю сообщений для контекста (например, если пользователь пишет 'туда', определи вуз или специальность из предыдущих сообщений). Формат ответа — JSON: { "sql": "<SQL-запрос>", "comment": "<объяснение на русском языке>", "data_type": "regions|cities|universities|faculties|specialties|subjects|subject_combinations|specialty_subjects|favorite_universities|favorite_specialties|faculty_specialties", "structured_data": [] }. Поле data_type указывает тип данных: 'regions' для регионов, 'cities' для городов, 'universities' для вузов, 'faculties' для факультетов, 'specialties' для специальностей, 'subjects' для предметов, 'subject_combinations' для комбинаций предметов, 'specialty_subjects' для специальностей с предметами, 'favorite_universities' для избранных вузов текущего пользователя, 'favorite_specialties' для избранных специальностей текущего пользователя, 'faculty_specialties' для связей факультетов и специальностей. Поле structured_data должно быть пустым массивом, так как данные будут извлечены из базы данных.

        Используй следующие таблицы и их столбцы:
        - region (id, name)
        - city (id, name, region_id)
        - university (id, short_name, full_name, type, avg_ege_score, country_ranking, city_id)
        - faculty (id, name, university_id)
        - specialty (id, name, program_code, description)
        - subject (id, name)
        - subject_combination (id, specialty_id)
        - required_subject (combination_id, subject_id)
        - user_favorite_university (user_id, university_id)
        - user_favorite_specialty (user_id, specialty_id)
        - faculty_specialty (faculty_id, specialty_id)
        - users (id, username) — ТОЛЬКО для текущего пользователя с фильтрацией по username = '{username}'. Запрещено выбирать поле password или любые данные других пользователей.

        Ограничения:
        - Разрешено использовать таблицу users ТОЛЬКО для выборки полей id и username и ТОЛЬКО для текущего пользователя (username = '{username}'). Запрещено выбирать поле password или любые данные других пользователей.
        - Запрещено использовать таблицы roles, user_roles в SQL-запросах.
        - Запрещены запросы, связанные с безопасностью приложения, включая:
            - Запросы о структуре базы данных (например, "как устроена БД", "какие таблицы есть").
            - Запросы о ролях пользователей (например, "какая у меня роль").
            - Запросы о других пользователях или общем количестве пользователей (например, "сколько всего пользователей").
            - Запросы о системе или приложении (например, "как работает приложение").
        - Если запрос относится к запрещённым темам, верни пустой sql и комментарий: "Ошибка: доступ к данным о системе, ролях или других пользователях запрещён."
        - Минимальные баллы ЕГЭ по предметам или специальностям НЕ хранятся. Используй university.avg_ege_score для приблизительной оценки.
        - Генерируй ТОЛЬКО SELECT-запросы.
        - Выбирай ТОЛЬКО релевантные поля для ответа (например, для регионов — name; для вузов — short_name, full_name, avg_ege_score; для специальностей — name, program_code, description).
        - Исключай технические поля (id, region_id, city_id, university_id, faculty_id, specialty_id, combination_id, subject_id, user_id), если они не нужны пользователю.
        - Если данные отсутствуют, верни пустой sql и пояснение в comment.
        - Учитывай контекст из истории сообщений для уточнения запроса.
        - Для запросов, связанных с избранными вузами или специальностями, используй username = '{username}' для фильтрации по текущему пользователю.

        Примеры:
        1. Запрос: "Какие регионы есть в базе?"
        {
          "sql": "SELECT name FROM region ORDER BY name",
          "comment": "Возвращены все регионы из базы данных.",
          "data_type": "regions",
          "structured_data": []
        }
        2. Запрос: "В каких городах есть вузы?"
        {
          "sql": "SELECT DISTINCT c.name FROM city c JOIN university u ON c.id = u.city_id ORDER BY c.name",
          "comment": "Возвращены города, в которых есть вузы.",
          "data_type": "cities",
          "structured_data": []
        }
        3. Запрос: "В какие вузы я могу поступить с 75 баллами по ЕГЭ?"
        {
          "sql": "SELECT short_name, full_name, avg_ege_score FROM university WHERE avg_ege_score <= 75 ORDER BY avg_ege_score DESC",
          "comment": "Возвращены вузы с проходным баллом до 75.",
          "data_type": "universities",
          "structured_data": []
        }
        4. Запрос: "Какие факультеты в МГУ?"
        {
          "sql": "SELECT f.name FROM faculty f JOIN university u ON f.university_id = u.id WHERE u.short_name = 'МГУ' ORDER BY f.name",
          "comment": "Возвращены факультеты МГУ.",
          "data_type": "faculties",
          "structured_data": []
        }
        5. Запрос: "Какие специальности на факультете вычислительной математики в МГУ?"
        {
          "sql": "SELECT s.name, s.program_code, s.description FROM specialty s JOIN faculty_specialty fs ON s.id = fs.specialty_id JOIN faculty f ON fs.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'МГУ' AND f.name = 'Факультет вычислительной математики' ORDER BY s.name",
          "comment": "Возвращены специальности на факультете вычислительной математики в МГУ.",
          "data_type": "faculty_specialties",
          "structured_data": []
        }
        6. Запрос: "Какие предметы нужны для поступления в ДГУ?"
        {
          "sql": "SELECT DISTINCT s.name FROM subject s JOIN required_subject rs ON s.id = rs.subject_id JOIN subject_combination sc ON rs.combination_id = sc.id JOIN specialty sp ON sc.specialty_id = sp.id JOIN faculty_specialty fs ON sp.id = fs.specialty_id JOIN faculty f ON fs.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'ДГУ' ORDER BY s.name",
          "comment": "Возвращены предметы, необходимые для поступления в ДГУ.",
          "data_type": "subjects",
          "structured_data": []
        }
        7. Запрос: "Какие комбинации предметов для биоинженерии?"
        {
          "sql": "SELECT sc.id, array_agg(s.name) as subjects FROM subject_combination sc JOIN required_subject rs ON sc.id = rs.combination_id JOIN subject s ON rs.subject_id = s.id JOIN specialty sp ON sc.specialty_id = sp.id WHERE sp.name = 'Биоинженерия' GROUP BY sc.id",
          "comment": "Возвращены комбинации предметов для специальности Биоинженерия.",
          "data_type": "subject_combinations",
          "structured_data": []
        }
        8. Запрос: "Какие предметы нужны для каждой специальности в МГУ?"
        {
          "sql": "SELECT sp.name, sp.program_code, array_agg(s.name) as required_subjects FROM specialty sp JOIN subject_combination sc ON sp.id = sc.specialty_id JOIN required_subject rs ON sc.id = rs.combination_id JOIN subject s ON rs.subject_id = s.id JOIN faculty_specialty fs ON sp.id = fs.specialty_id JOIN faculty f ON fs.faculty_id = f.id JOIN university u ON f.university_id = u.id WHERE u.short_name = 'МГУ' GROUP BY sp.id, sp.name, sp.program_code",
          "comment": "Возвращены специальности МГУ с требуемыми предметами.",
          "data_type": "specialty_subjects",
          "structured_data": []
        }
        9. Запрос: "Мои избранные вузы"
        {
          "sql": "SELECT u.short_name, u.full_name, u.avg_ege_score FROM university u JOIN user_favorite_university ufu ON u.id = ufu.university_id JOIN users us ON ufu.user_id = us.id WHERE us.username = '{username}' ORDER BY u.short_name",
          "comment": "Возвращены избранные вузы текущего пользователя.",
          "data_type": "favorite_universities",
          "structured_data": []
        }
        10. Запрос: "Мои избранные специальности"
        {
          "sql": "SELECT s.name, s.program_code, s.description FROM specialty s JOIN user_favorite_specialty ufs ON s.id = ufs.specialty_id JOIN users us ON ufs.user_id = us.id WHERE us.username = '{username}' ORDER BY s.name",
          "comment": "Возвращены избранные специальности текущего пользователя.",
          "data_type": "favorite_specialties",
          "structured_data": []
        }
        11. Запрос: "Какие у них есть специальности?" (в контексте предыдущего запроса о избранных вузах)
        {
          "sql": "SELECT s.name, s.program_code, s.description FROM specialty s JOIN faculty_specialty fs ON s.id = fs.specialty_id JOIN faculty f ON fs.faculty_id = f.id JOIN university u ON f.university_id = u.id JOIN user_favorite_university ufu ON u.id = ufu.university_id JOIN users us ON ufu.user_id = us.id WHERE us.username = '{username}' ORDER BY s.name",
          "comment": "Возвращены специальности для избранных университетов текущего пользователя.",
          "data_type": "specialties",
          "structured_data": []
        }
        12. Запрос: "Какая у меня роль?" или "Сколько всего пользователей?" или "Как устроена база данных?"
        {
          "sql": "",
          "comment": "Ошибка: доступ к данным о системе, ролях или других пользователях запрещён.",
          "data_type": "",
          "structured_data": []
        }
        """;

    @Value("${gigachat.api.oauth-url}")
    private String oauthUrl;

    @Value("${gigachat.api.url}")
    private String gigaChatApiUrl;

    @Value("${gigachat.api.key}")
    private String authorizationKey;

    @Value("${gigachat.api.scope}")
    private String scope;

    @Value("${jwt.secret}")
    private String jwtSecret;

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
            // Validate model
            if (model == null || !List.of("GigaChat-2-Pro", "GigaChat-2-Max", "GigaChat-2").contains(model)) {
                logger.warn("Invalid model: {}. Defaulting to GigaChat-Pro", model);
                model = "GigaChat-2-Pro";
            }

            // Validate messages
            if (messages == null || messages.isEmpty()) {
                logger.error("Messages list is null or empty");
                return createErrorResponse("Список сообщений пуст или отсутствует");
            }

            // Extract username from JWT
            String username;
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
                username = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(jwtToken)
                        .getPayload()
                        .getSubject();
                if (username == null || username.isEmpty()) {
                    logger.error("No username found in JWT token");
                    return createErrorResponse("Ошибка: пользователь не идентифицирован в JWT-токене");
                }
            } catch (Exception e) {
                logger.error("Failed to parse JWT token: {}", e.getMessage(), e);
                return createErrorResponse("Ошибка: не удалось разобрать JWT-токен: " + e.getMessage());
            }

            // Add system prompt with username
            List<Message> requestMessages = new ArrayList<>();
            String resolvedPrompt = SYSTEM_PROMPT.replace("{username}", username);
            requestMessages.add(new Message("system", resolvedPrompt));
            requestMessages.addAll(messages);

            // Refresh token if needed
            refreshTokenIfNeeded();

            // Prepare GigaChat API request
            Map<String, Object> requestBodyMap = new HashMap<>();
            requestBodyMap.put("model", model);
            requestBodyMap.put("messages", requestMessages);

            String requestBody;
            try {
                requestBody = objectMapper.writeValueAsString(requestBodyMap);
            } catch (JsonProcessingException e) {
                logger.error("Failed to serialize request body: {}", e.getMessage(), e);
                return createErrorResponse("Ошибка при формировании запроса к GigaChat: " + e.getMessage());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            logger.debug("GigaChat Request: URL={}, Headers={}, Body={}", gigaChatApiUrl, headers, requestBody);

            ResponseEntity<Map> response;
            try {
                response = restTemplate.postForEntity(gigaChatApiUrl, entity, Map.class);
            } catch (RestClientException e) {
                logger.error("GigaChat API request failed: {}", e.getMessage(), e);
                return createErrorResponse("Ошибка обращения к GigaChat API: " + e.getMessage());
            }

            logger.debug("GigaChat Response: Status={}, Body={}", response.getStatusCode(), response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                logger.error("GigaChat API returned non-success status: {}", response.getStatusCode());
                return createErrorResponse("Ошибка GigaChat: " + response.getStatusCode());
            }

            // Extract SQL, comment, and data_type
            Map<String, Object> gigaChatResponse;
            try {
                gigaChatResponse = extractResponseFromGigaChat(response.getBody());
            } catch (Exception e) {
                logger.error("Failed to extract GigaChat response: {}", e.getMessage(), e);
                return createErrorResponse("Ошибка: не удалось извлечь ответ из GigaChat: " + e.getMessage());
            }

            String sqlQuery = (String) gigaChatResponse.get("sql");
            String comment = (String) gigaChatResponse.get("comment");
            String dataType = (String) gigaChatResponse.get("data_type");

            // If SQL is empty or invalid, return the comment
            if (sqlQuery == null || sqlQuery.trim().isEmpty() || sqlQuery.contains("[object Object]")) {
                return createErrorResponse(comment != null ? comment : "Ошибка: некорректный SQL-запрос.");
            }

            // Validate SQL (SELECT only, no restricted tables, and username validation)
            if (!isSelectQuery(sqlQuery, username)) {
                logger.error("Invalid SQL query: only SELECT queries allowed, no restricted tables, and username must match: {}", sqlQuery);
                return createErrorResponse("Ошибка: недопустимый SQL-запрос или доступ к запрещенным данным.", comment);
            }

            // Execute SQL and use database results
            try {
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sqlQuery);
                if (results.isEmpty()) {
                    logger.warn("SQL query returned no results: {}", sqlQuery);
                    return createErrorResponse("Извините, информация по вашему запросу отсутствует.", comment);
                }

                // Always use database results, formatted by structureData
                List<Object> finalData = structureData(results, dataType);
                return Map.of("status", "success", "data", finalData, "comment", comment, "data_type", dataType);
            } catch (Exception e) {
                logger.error("SQL execution error: {}", e.getMessage(), e);
                return createErrorResponse("Ошибка выполнения SQL-запроса: " + e.getMessage(), comment);
            }
        } catch (Exception e) {
            logger.error("Unexpected error in queryGigaChat: {}", e.getMessage(), e);
            return createErrorResponse("Неожиданная ошибка при обращении к GigaChat: " + e.getMessage());
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        return createErrorResponse(message, null);
    }

    private Map<String, Object> createErrorResponse(String message, String comment) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", message);
        response.put("sql", "");
        response.put("comment", comment != null ? comment : message);
        response.put("data_type", "");
        response.put("data", new ArrayList<>());
        return response;
    }

    private List<Object> structureData(List<Map<String, Object>> results, String dataType) {
        if (results == null || results.isEmpty()) {
            return new ArrayList<>();
        }

        switch (dataType) {
            case "regions":
            case "cities":
            case "faculties":
            case "subjects":
                return results.stream()
                        .map(row -> row.get("name"))
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
            case "universities":
            case "favorite_universities":
                return results.stream()
                        .map(row -> {
                            Map<String, Object> uni = new HashMap<>();
                            uni.put("short_name", row.get("short_name"));
                            uni.put("full_name", row.get("full_name"));
                            uni.put("avg_ege_score", row.get("avg_ege_score") != null ? row.get("avg_ege_score") : 0);
                            return uni;
                        })
                        .distinct()
                        .collect(Collectors.toList());
            case "specialties":
            case "favorite_specialties":
            case "faculty_specialties":
                return results.stream()
                        .map(row -> Map.of(
                                "name", row.get("name"),
                                "program_code", row.get("program_code"),
                                "description", row.get("description") != null ? row.get("description") : ""
                        ))
                        .distinct()
                        .collect(Collectors.toList());
            case "subject_combinations":
                return results.stream()
                        .map(row -> Map.of(
                                "combination_id", row.get("id"),
                                "subjects", row.get("subjects") != null ? row.get("subjects") : ""
                        ))
                        .distinct()
                        .collect(Collectors.toList());
            case "specialty_subjects":
                return results.stream()
                        .map(row -> {
                            Map<String, Object> specialty = new HashMap<>();
                            specialty.put("name", row.get("name"));
                            specialty.put("program_code", row.get("program_code"));
                            specialty.put("required_subjects", row.get("required_subjects") != null ? row.get("required_subjects") : "");
                            if (row.containsKey("faculty_name")) {
                                specialty.put("faculty_name", row.get("faculty_name"));
                            }
                            if (row.containsKey("min_avg_ege_score")) {
                                specialty.put("min_avg_ege_score", row.get("min_avg_ege_score") != null ? row.get("min_avg_ege_score") : 0);
                            }
                            return specialty;
                        })
                        .distinct()
                        .collect(Collectors.toList());
            default:
                return results.stream()
                        .map(row -> row.entrySet().stream()
                                .collect(Collectors.toMap(
                                        Map.Entry::getKey,
                                        entry -> String.valueOf(entry.getValue() != null ? entry.getValue() : "")
                                ))
                        )
                        .collect(Collectors.toList());
        }
    }

    public Map<String, Object> extractResponseFromGigaChat(Map<String, Object> responseBody) {
        if (responseBody == null) {
            logger.error("GigaChat response body is null");
            return createErrorResponse("Ответ от GigaChat пустой или отсутствует");
        }

        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            logger.error("GigaChat response contains no choices");
            return createErrorResponse("Ошибка: ответ от GigaChat не содержит данных");
        }

        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null || !message.containsKey("content")) {
            logger.error("GigaChat response message is null or missing content");
            return createErrorResponse("Ошибка: сообщение от GigaChat пустое или отсутствует");
        }

        String content = (String) message.get("content");
        if (content == null || content.trim().isEmpty()) {
            logger.error("GigaChat response content is empty");
            return createErrorResponse("Ошибка: содержимое ответа от GigaChat пустое");
        }

        logger.debug("GigaChat response content: {}", content);

        // Try parsing as JSON first
        try {
            if (content.trim().startsWith("{") && content.trim().endsWith("}")) {
                Map<String, Object> result = objectMapper.readValue(content, new TypeReference<Map<String, Object>>() {});
                validateResponse(result);
                return result;
            }
        } catch (JsonProcessingException e) {
            logger.warn("Failed to parse response as JSON: {}. Attempting markdown parsing.", e.getMessage());
        }

        // Try parsing as markdown
        try {
            return parseMarkdownResponse(content);
        } catch (Exception e) {
            logger.error("Failed to parse markdown response: {}. Raw content: {}", e.getMessage(), content);
            return createErrorResponse("Ошибка: не удалось разобрать ответ от GigaChat: неверный формат");
        }
    }

    private Map<String, Object> parseMarkdownResponse(String content) {
        // Pattern for markdown: optional sql block, followed by comment and data_type
        Pattern markdownPattern = Pattern.compile(
                "(?:```sql\\n(?<sql>.*?)\\n```)?\\s*(?:\\*\\*comment\\*\\*:\\s*(?<comment>.*?))?\\s*(?:\\*\\*data_type\\*\\*:\\s*(?<dataType>.*?))?$",
                Pattern.DOTALL
        );
        Matcher matcher = markdownPattern.matcher(content);

        Map<String, Object> result = new HashMap<>();
        result.put("structured_data", new Object[0]);

        if (matcher.find()) {
            String sql = matcher.group("sql") != null ? matcher.group("sql").trim() : "";
            String comment = matcher.group("comment") != null ? matcher.group("comment").trim() : "";
            String dataType = matcher.group("dataType") != null ? matcher.group("dataType").trim() : "";

            result.put("sql", sql);
            result.put("comment", comment);
            result.put("data_type", dataType);

            validateResponse(result);
            return result;
        }

        // Try extracting JSON-like content
        Pattern jsonPattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
        Matcher jsonMatcher = jsonPattern.matcher(content);
        if (jsonMatcher.find()) {
            try {
                String jsonContent = jsonMatcher.group(0);
                Map<String, Object> resultFromJson = objectMapper.readValue(jsonContent, new TypeReference<Map<String, Object>>() {});
                validateResponse(resultFromJson);
                return resultFromJson;
            } catch (JsonProcessingException e) {
                logger.warn("Failed to parse JSON-like content in markdown: {}", e.getMessage());
            }
        }

        throw new IllegalStateException("Markdown format does not match expected pattern");
    }

    private void validateResponse(Map<String, Object> response) {
        // Check required fields
        if (!response.containsKey("sql") || !response.containsKey("comment") || !response.containsKey("data_type")) {
            throw new IllegalStateException("Response missing required fields: sql, comment, or data_type");
        }
        // Validate data_type
        String dataType = (String) response.get("data_type");
        if (dataType != null && !dataType.isEmpty() && !isValidDataType(dataType)) {
            throw new IllegalStateException("Invalid data_type: " + dataType);
        }
    }

    private boolean isValidDataType(String dataType) {
        return switch (dataType) {
            case "regions", "cities", "universities", "faculties", "specialties", "subjects",
                 "subject_combinations", "specialty_subjects", "favorite_universities",
                 "favorite_specialties", "faculty_specialties" -> true;
            default -> false;
        };
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
                    logger.debug("OAuth Request: URL={}, Headers={}, Body={}", oauthUrl, headers, body);

                    ResponseEntity<Map> response;
                    try {
                        response = restTemplate.postForEntity(oauthUrl, entity, Map.class);
                    } catch (RestClientException e) {
                        logger.error("OAuth request failed: {}", e.getMessage(), e);
                        throw new RuntimeException("Не удалось получить access token GigaChat: " + e.getMessage(), e);
                    }

                    logger.debug("OAuth Response: Status={}, Body={}", response.getStatusCode(), response.getBody());

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

    private boolean isSelectQuery(String sqlQuery, String username) {
        if (sqlQuery == null || sqlQuery.trim().isEmpty()) {
            return false;
        }
        String lowerCaseSql = sqlQuery.trim().toLowerCase();

        // Check if it's a SELECT query
        boolean isSelect = lowerCaseSql.startsWith("select");
        if (!isSelect) {
            return false;
        }

        // Check for restricted tables (roles, user_roles)
        boolean hasRestrictedTables = lowerCaseSql.contains("roles") || lowerCaseSql.contains("user_roles");
        if (hasRestrictedTables) {
            return false;
        }

        // Validate usage of the users table
        boolean isUsersTableValid = true;
        if (lowerCaseSql.contains("users")) {
            // Ensure only id and username are selected from users
            String selectClause = lowerCaseSql.substring(0, lowerCaseSql.indexOf("from")).toLowerCase();
            if (selectClause.contains("password")) {
                logger.error("SQL query attempts to select password from users table: {}", sqlQuery);
                return false;
            }
            // Ensure the query filters by the current username
            if (!lowerCaseSql.contains("username = '" + username.toLowerCase() + "'")) {
                logger.error("SQL query on users table does not filter by current username: {}", sqlQuery);
                return false;
            }
            // Ensure users table is used only with user_favorite_university or user_favorite_specialty
            if (!lowerCaseSql.contains("user_favorite_university") && !lowerCaseSql.contains("user_favorite_specialty")) {
                logger.error("SQL query uses users table without user_favorite_university or user_favorite_specialty: {}", sqlQuery);
                return false;
            }
        }

        // Validate username in queries involving user-specific data
        boolean hasValidUsername = true;
        if (lowerCaseSql.contains("user_favorite_university") || lowerCaseSql.contains("user_favorite_specialty")) {
            hasValidUsername = lowerCaseSql.contains("username = '" + username.toLowerCase() + "'");
        }

        return isSelect && !hasRestrictedTables && isUsersTableValid && hasValidUsername;
    }
}