package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AuthRequest;
import com.unidata.university_system.dto.AuthResponse;
import com.unidata.university_system.dto.RegisterRequest;
import com.unidata.university_system.dto.UserResponse;
import com.unidata.university_system.models.Role;
import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.RoleRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.services.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        log.info("Login attempt for user: {}", request.email());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );

            User user = (User) authentication.getPrincipal();
            log.info("User authenticated: {}", user.getEmail());

            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (Exception e) {
            log.error("Authentication failed for user: {}", request.email(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "Invalid email or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new AuthResponse(null, "Email already exists"));
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setCreatedAt(java.time.LocalDateTime.now());

        Optional<Role> userRole = roleRepository.findByName("Пользователь");
        if (userRole.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(null, "Default role 'Пользователь' not found"));
        }
        user.setRole(userRole.get());

        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token));
    }
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        UserResponse response = new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getStatus() != null ? user.getStatus().getName() : null,
                user.isEnabled()
        );
        return ResponseEntity.ok(response);
    }

}