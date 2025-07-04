package com.unidata.university_system.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class AssistantService {
    @Value("${gigachat.api.oauth-url:https://ngw.devices.sberbank.ru:9443/api/v2/oauth}")
    private String oauthUrl;

    @Value("${gigachat.api.url:https://gigachat.devices.sberbank.ru/api/v1/chat/completions}")
    private String gigaChatApiUrl;

    @Value("${gigachat.api.key}")
    private String authorizationKey;

    @Value("${gigachat.api.scope:GIGACHAT_API_PERS}")
    private String scope;

    private String accessToken;
    private long expiresAt = 0;
    private final ReentrantLock tokenLock = new ReentrantLock();

    private void refreshTokenIfNeeded() {
        long now = Instant.now().getEpochSecond();
        if (accessToken == null || now >= expiresAt) {
            tokenLock.lock();
            try {
                if (accessToken == null || now >= expiresAt) {
                    RestTemplate restTemplate = new RestTemplate();
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
                    headers.set("Authorization", "Basic " + authorizationKey);
                    headers.set("RqUID", java.util.UUID.randomUUID().toString());
                    String body = "scope=" + scope;
                    HttpEntity<String> entity = new HttpEntity<>(body, headers);
                    ResponseEntity<Map> response = restTemplate.postForEntity(oauthUrl, entity, Map.class);
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        accessToken = (String) response.getBody().get("access_token");
                        Object expiresAtObj = response.getBody().get("expires_at");
                        if (expiresAtObj instanceof Number) {
                            expiresAt = ((Number) expiresAtObj).longValue() / 1000 - 10; // небольшой запас
                        } else {
                            expiresAt = now + 1700; // fallback: 28 минут
                        }
                    } else {
                        throw new RuntimeException("Не удалось получить access token GigaChat: " + response);
                    }
                }
            } finally {
                tokenLock.unlock();
            }
        }
    }

    public String processQuery(String userQuery) {
        try {
            refreshTokenIfNeeded();
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);
            String requestBody = "{\"model\":\"GigaChat\",\"messages\":[{\"role\":\"user\",\"content\":\"" + userQuery.replace("\"", "\\\"") + "\"}]}";
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(gigaChatApiUrl, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
            return "Ошибка GigaChat: " + response.getStatusCode();
        } catch (Exception e) {
            return "Ошибка обращения к GigaChat: " + e.getMessage();
        }
    }
}
