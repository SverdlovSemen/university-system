package com.unidata.university_system.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    // Секретный ключ из application.properties
    @Value("${jwt.secret}")
    private String secretKey;

    // Время жизни токена (в миллисекундах)
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    // Алгоритм подписи
    private Algorithm getSigningAlgorithm() {
        return Algorithm.HMAC256(secretKey.getBytes());
    }

    // Генерация JWT токена
    public String generateToken(UserDetails userDetails) {
        return JWT.create()
                .withSubject(userDetails.getUsername()) // Идентификатор пользователя
                .withIssuedAt(new Date()) // Время создания
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpirationMs)) // Время истечения
                .sign(getSigningAlgorithm()); // Подпись
    }

    // Проверка токена
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JWTVerificationException ex) {
            return false;
        }
    }

    // Извлечение имени пользователя из токена
    public String extractUsername(String token) {
        return getJWTVerifier().verify(token).getSubject();
    }

    // Проверка истечения срока действия токена
    private boolean isTokenExpired(String token) {
        return getJWTVerifier().verify(token).getExpiresAt().before(new Date());
    }

    // Создание верификатора токена
    private JWTVerifier getJWTVerifier() {
        return JWT.require(getSigningAlgorithm()).build();
    }
}