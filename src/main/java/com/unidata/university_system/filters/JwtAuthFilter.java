package com.unidata.university_system.filters;

import com.unidata.university_system.services.CustomUserDetailsService;
import com.unidata.university_system.services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component // Регестрируем фильтр как Spring bean
@RequiredArgsConstructor // Генерируем конструктор для final полей
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Получаем заголовок Authorization
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 2. Проверяем наличие и формат заголовка
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Если токена нет - пропускаем запрос дальше
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Извлекаем JWT из заголовка (убираем "Bearer ")
        jwt = authHeader.substring(7);

        // 4. Извлекаем имя пользователя из токена
        username = jwtService.extractUsername(jwt);

        // 5. Если username извлечен и пользователь еще не аутентифицирован
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 6. Загружаем данные пользователя из базы
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 7. Проверяем валидность токена
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // 8. Создаем объект аутентификации
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // credentials не нужны, так как токен уже подтвержден
                        userDetails.getAuthorities()
                );

                // 9. Добавляем детали запроса (IP, сессия и т.д.)
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 10. Устанавливаем аутентификацию в контекст безопасности
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 11. Продолжаем цепочку фильтров
        filterChain.doFilter(request, response);
    }
}