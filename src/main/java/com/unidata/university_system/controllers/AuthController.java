package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AuthRequest;
import com.unidata.university_system.dto.AuthResponse;
import com.unidata.university_system.dto.RegisterRequest;
import com.unidata.university_system.models.Role;
import com.unidata.university_system.models.User;
import com.unidata.university_system.models.UserStatus;
import com.unidata.university_system.repositories.RoleRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UserStatusRepository;
import com.unidata.university_system.services.CustomUserDetailsService;
import com.unidata.university_system.services.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        String token = jwtService.generateToken(customUserDetailsService.loadUserByUsername(request.email()));
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            if (userRepository.existsByEmail(request.email())) {
                return ResponseEntity
                        .badRequest()
                        .body("Пользователь с email " + request.email() + " уже существует");
            }

            User user = new User();
            user.setEmail(request.email());
            user.setFirstName(request.firstName());
            user.setPassword(passwordEncoder.encode(request.password()));

            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Роль USER не найдена"));
            user.setRole(userRole);

            UserStatus activeStatus = userStatusRepository.findByName("ACTIVE")
                    .orElseThrow(() -> new RuntimeException("Статус ACTIVE не найден"));
            user.setStatus(activeStatus);

            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);
            String token = jwtService.generateToken(customUserDetailsService.loadUserByUsername(savedUser.getEmail()));

            return ResponseEntity.ok(new AuthResponse(token, "Регистрация успешна"));

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при регистрации: " + e.getMessage());
        }
    }
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getEmail());  // Для совместимости
            response.put("firstName", user.getFirstName());
            response.put("email", user.getEmail());
            response.put("roles", List.of(user.getRole() != null ? user.getRole().getName() : "ROLE_USER"));
            response.put("favoriteUniversities", List.of());
            response.put("favoriteSpecialties", List.of());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting profile: " + e.getMessage());
        }
    }
}