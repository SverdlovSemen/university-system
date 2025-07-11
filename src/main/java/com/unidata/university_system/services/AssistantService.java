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
                    System.out.println("OAuth Request: URL=" + oauthUrl + ", Headers=" + headers + ", Body=" + body);
                    ResponseEntity<Map> response = restTemplate.postForEntity(oauthUrl, entity, Map.class);
                    System.out.println("OAuth Response: Status=" + response.getStatusCode() + ", Body=" + response.getBody());
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
                throw new RuntimeException("Failed to refresh GigaChat token: " + e.getMessage(), e);
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
            String requestBody = "{\"model\":\"GigaChat-Pro\",\"messages\":[{\"role\":\"user\",\"content\":\"" + userQuery.replace("\"", "\\\"") + "\"}]}";
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            System.out.println("GigaChat Request: URL=" + gigaChatApiUrl + ", Headers=" + headers + ", Body=" + requestBody);
            ResponseEntity<String> response = restTemplate.postForEntity(gigaChatApiUrl, entity, String.class);
            System.out.println("GigaChat Response: Status=" + response.getStatusCode() + ", Body=" + response.getBody());
            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
            return "Ошибка GigaChat: " + response.getStatusCode();
        } catch (Exception e) {
            return "Ошибка обращения к GigaChat: " + e.getMessage();
        }
    }
}