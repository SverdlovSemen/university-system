package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AuthRequest;
import com.unidata.university_system.dto.AuthResponse;
import com.unidata.university_system.dto.RegisterRequest;
import com.unidata.university_system.models.Role;
import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.RoleRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.services.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Основные зависимости
    private final AuthenticationManager authenticationManager;// Проверяет учетные данные пользователя
    private final UserRepository userRepository; // Работа с пользователями в бд
    private final RoleRepository roleRepository; // Работа с ролями пользователей
    private final PasswordEncoder passwordEncoder; // Шифрование паролей
    private final JwtService jwtService; // Генерируем JWT токены

    /**
     * Обработка запроса на вход
     * @param request Данные аутентификации (username и password)
     * @return JWT токен
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        // 1. Аутентификация пользователя
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        // 2. Получение аутентифицированного пользователя
        User user = (User) authentication.getPrincipal();

        // 3. Генерация JWT токена
        String token = jwtService.generateToken(user);

        // 4. Возврат токена в ответе
        return ResponseEntity.ok(new AuthResponse(token));
    }

    /**
     * Обработка запроса на регистрацию
     * @param request Данные для регистрации (username и password)
     * @return JWT токен для нового пользователя
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // 1. Проверка существования пользователя
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username already exists");
        }

        // 2. Создание нового пользователя
        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEnabled(true);

        // 3. Назначение роли USER по умолчанию
        Optional<Role> userRole = roleRepository.findByRoleName("ROLE_USER");
        if (userRole.isEmpty()) {
            throw new RuntimeException("Default role 'ROLE_USER' not found. Please initialize roles in the database.");
        }
        user.setRoles(Collections.singleton(userRole.get()));

        // 4. Сохранение пользователя
        userRepository.save(user);

        // 5. Генерация токена для нового пользователя
        String token = jwtService.generateToken(user);

        // 6. Возврат токена в ответе
        return ResponseEntity.ok(new AuthResponse(token));
    }
}