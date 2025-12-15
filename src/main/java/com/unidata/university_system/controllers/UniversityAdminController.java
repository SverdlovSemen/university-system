package com.unidata.university_system.controllers;

import com.unidata.university_system.models.UniversityEmployee;
import com.unidata.university_system.models.User;
import com.unidata.university_system.models.Role;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.repositories.UniversityRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/universities")
@RequiredArgsConstructor
public class UniversityAdminController {

    private final UniversityEmployeeRepository universityEmployeeRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UniversityRepository universityRepository;

    // List editors for a university (only university admin of that university or site admin)
    @GetMapping("/{universityId}/editors")
    public ResponseEntity<?> listEditors(@PathVariable Long universityId, Authentication authentication) {
        try {
            String email = authentication.getName();
            User current = userRepository.findByEmail(email).orElse(null);
            boolean isSiteAdmin = current != null && current.getRole() != null && "ROLE_ADMIN".equals(current.getRole().getName());
            boolean isAssigned = current != null && universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, current.getId());
            if (!isSiteAdmin && !isAssigned) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
            }

            List<UniversityEmployee> list = universityEmployeeRepository.findByUniversityId(universityId);
            List<Map<String, Object>> users = list.stream()
                    .map(ue -> {
                        User u = ue.getUser();
                        return Map.<String, Object>of("id", u.getId(), "email", u.getEmail(), "firstName", u.getFirstName(), "role", u.getRole() != null ? u.getRole().getName() : null);
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // Assign editor to a university (university admin or site admin)
    @PostMapping("/{universityId}/editors")
    public ResponseEntity<?> assignEditor(@PathVariable Long universityId, @RequestBody Map<String, Long> body, Authentication authentication) {
        try {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body(Map.of("message", "userId required"));

            String email = authentication.getName();
            User current = userRepository.findByEmail(email).orElse(null);
            boolean isSiteAdmin = current != null && current.getRole() != null && "ROLE_ADMIN".equals(current.getRole().getName());
            boolean isAssigned = current != null && universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, current.getId());
            if (!isSiteAdmin && !isAssigned) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return ResponseEntity.badRequest().body(Map.of("message", "User not found"));

            Role editorRole = roleRepository.findByName("ROLE_EDITOR").orElse(null);
            if (editorRole == null) {
                editorRole = new Role();
                editorRole.setName("ROLE_EDITOR");
                roleRepository.save(editorRole);
            }
            user.setRole(editorRole);
            userRepository.save(user);

            // create mapping if not exists
            if (!universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, userId)) {
                UniversityEmployee ue = new UniversityEmployee();
                ue.setUniversityId(universityId);
                ue.setUserId(userId);
                universityEmployeeRepository.save(ue);
            }

            return ResponseEntity.ok(Map.of("message", "User assigned as editor"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    // Remove editor from university (university admin or site admin)
    @DeleteMapping("/{universityId}/editors/{userId}")
    public ResponseEntity<?> removeEditor(@PathVariable Long universityId, @PathVariable Long userId, Authentication authentication) {
        try {
            String email = authentication.getName();
            User current = userRepository.findByEmail(email).orElse(null);
            boolean isSiteAdmin = current != null && current.getRole() != null && "ROLE_ADMIN".equals(current.getRole().getName());
            boolean isAssigned = current != null && universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, current.getId());
            if (!isSiteAdmin && !isAssigned) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
            }

            // delete mapping
            universityEmployeeRepository.deleteByUniversityIdAndUserId(universityId, userId);

            // demote user role to ROLE_USER
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                Role userRole = roleRepository.findByName("ROLE_USER").orElse(null);
                if (userRole == null) {
                    userRole = new Role();
                    userRole.setName("ROLE_USER");
                    roleRepository.save(userRole);
                }
                user.setRole(userRole);
                userRepository.save(user);
            }

            return ResponseEntity.ok(Map.of("message", "Editor removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}
