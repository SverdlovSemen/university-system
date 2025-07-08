package com.unidata.university_system.services;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    private Algorithm getSigningAlgorithm() {
        return Algorithm.HMAC256(secretKey.getBytes());
    }

    public String generateToken(UserDetails userDetails) {
        // Извлекаем роли в виде списка строк
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return JWT.create()
                .withSubject(userDetails.getUsername())
                .withClaim("roles", roles) // Добавляем роли в токен
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .sign(getSigningAlgorithm());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JWTVerificationException ex) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return getJWTVerifier().verify(token).getSubject();
    }

    private boolean isTokenExpired(String token) {
        return getJWTVerifier().verify(token).getExpiresAt().before(new Date());
    }

    private JWTVerifier getJWTVerifier() {
        return JWT.require(getSigningAlgorithm()).build();
    }
}