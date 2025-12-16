package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AuthRequest;
import com.unidata.university_system.dto.AuthResponse;
import com.unidata.university_system.dto.RegisterRequest;
import com.unidata.university_system.models.Role;
import com.unidata.university_system.models.UniversityEmployee;
import com.unidata.university_system.dto.RegisterEditorRequest;
import com.unidata.university_system.dto.AssignEditorRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.unidata.university_system.models.User;
import com.unidata.university_system.models.UserStatus;
import com.unidata.university_system.models.FavoriteUniversity;
import com.unidata.university_system.models.FavoriteProgram;
import com.unidata.university_system.repositories.RoleRepository;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.repositories.UniversityRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UserStatusRepository;
import com.unidata.university_system.services.CustomUserDetailsService;
import com.unidata.university_system.services.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private final UniversityEmployeeRepository universityEmployeeRepository;
    private final UniversityRepository universityRepository;

    @Value("${app.editor.code:}")
    private String appEditorCode;

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
    @PostMapping("/register-editor")
    public ResponseEntity<?> registerEditor(@Valid @RequestBody RegisterEditorRequest request) {
        try {
            if (userRepository.existsByEmail(request.email())) {
                return ResponseEntity
                        .badRequest()
                        .body("Пользователь с email " + request.email() + " уже существует");
            }

            // validate editor code
            if (appEditorCode == null || appEditorCode.isBlank() || !appEditorCode.equals(request.editorCode())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid editor code");
            }

            User user = new User();
            user.setEmail(request.email());
            user.setFirstName(request.firstName());
            user.setPassword(passwordEncoder.encode(request.password()));

            Role editorRole = roleRepository.findByName("ROLE_EDITOR")
                    .orElseThrow(() -> new RuntimeException("Роль EDITOR не найдена"));
            user.setRole(editorRole);

            UserStatus activeStatus = userStatusRepository.findByName("ACTIVE")
                    .orElseThrow(() -> new RuntimeException("Статус ACTIVE не найден"));
            user.setStatus(activeStatus);

            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);

            // create university_employee mapping if universityId provided
            if (request.universityId() != null) {
                Long uniId = request.universityId();
                universityRepository.findById(uniId).ifPresent(uni -> {
                    UniversityEmployee ue = new UniversityEmployee();
                    ue.setUniversityId(uni.getId());
                    ue.setUserId(savedUser.getId());
                    universityEmployeeRepository.save(ue);
                });
            }

            String token = jwtService.generateToken(customUserDetailsService.loadUserByUsername(savedUser.getEmail()));

            return ResponseEntity.ok(new AuthResponse(token, "Регистрация редактора успешна"));

        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при регистрации: " + e.getMessage());
        }
    }
    @PostMapping("/assign-editor")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_ADMIN')")
    public ResponseEntity<?> assignEditor(@Valid @RequestBody AssignEditorRequest request) {
        try {
            Long userId = request.userId();
            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();
            Role editorRole = roleRepository.findByName("ROLE_EDITOR")
                    .orElseThrow(() -> new RuntimeException("Роль EDITOR не найдена"));
            user.setRole(editorRole);
            userRepository.save(user);

            if (request.universityId() != null) {
                Long uniId = request.universityId();
                universityRepository.findById(uniId).ifPresent(uni -> {
                    UniversityEmployee ue = new UniversityEmployee();
                    ue.setUniversityId(uni.getId());
                    ue.setUserId(user.getId());
                    universityEmployeeRepository.save(ue);
                });
            }

            return ResponseEntity.ok(Map.of("message", "User promoted to editor"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
    @PostMapping("/assign-university-admin")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_ADMIN')")
    public ResponseEntity<?> assignUniversityAdmin(@Valid @RequestBody AssignEditorRequest request) {
        try {
            Long userId = request.userId();
            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
            }
            User user = userOpt.get();
            Role uniAdminRole = roleRepository.findByName("ROLE_UNIVERSITY_ADMIN").orElse(null);
            if (uniAdminRole == null) {
                uniAdminRole = new Role();
                uniAdminRole.setName("ROLE_UNIVERSITY_ADMIN");
                roleRepository.save(uniAdminRole);
            }
            user.setRole(uniAdminRole);
            userRepository.save(user);

            if (request.universityId() != null) {
                Long uniId = request.universityId();
                universityRepository.findById(uniId).ifPresent(uni -> {
                    UniversityEmployee ue = new UniversityEmployee();
                    ue.setUniversityId(uni.getId());
                    ue.setUserId(user.getId());
                    universityEmployeeRepository.save(ue);
                });
            }

            return ResponseEntity.ok(Map.of("message", "User promoted to university admin"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN','UNIVERSITY_ADMIN')")
    public ResponseEntity<?> listUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> out = users.stream()
                .map(u -> {
                    // load university assignments explicitly to avoid lazy/association timing issues
                        List<Long> uniIds = universityEmployeeRepository.findByUserId(u.getId()).stream()
                            .map(ue -> ue.getUniversityId())
                            .toList();
                    return Map.<String, Object>of(
                        "id", u.getId(),
                        "email", u.getEmail(),
                        "firstName", u.getFirstName(),
                        "role", u.getRole() != null ? u.getRole().getName() : null,
                        "universityIds", uniIds
                    );
                })
                .toList();
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            e.printStackTrace();
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            String stack = sw.toString();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error listing users: " + e.getMessage(), "stack", stack));
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

            // Получаем реальные избранные университеты
            List<Long> favoriteUniversityIds = user.getFavoriteUniversities().stream()
                    .map(FavoriteUniversity::getUniversityId)
                    .toList();
            response.put("favoriteUniversities", favoriteUniversityIds);

            // Получаем реальные избранные программы (для совместимости называем их specialties)
            List<Long> favoriteProgramIds = user.getFavoritePrograms().stream()
                    .map(FavoriteProgram::getProgramId)
                    .toList();
            response.put("favoriteSpecialties", favoriteProgramIds);

            // Load university assignments explicitly to avoid lazy-loading issues
                List<Long> employeeUniversityIds = universityEmployeeRepository.findByUserId(user.getId()).stream()
                    .map(UniversityEmployee::getUniversityId)
                    .toList();
            response.put("universityIds", employeeUniversityIds);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting profile: " + e.getMessage());
        }
    }
}
