package com.unidata.university_system.controllers;

import com.unidata.university_system.models.User;
import com.unidata.university_system.services.UserService;
import com.unidata.university_system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/university/{universityId}")
    public ResponseEntity<Void> addFavoriteUniversity(
            Authentication authentication,
            @PathVariable Long universityId
    ) {
        try {
            String email = authentication.getName();
            System.out.println("📧 FavoriteController: добавляем университет " + universityId + " для пользователя " + email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.addFavoriteUniversity(user.getId(), universityId);
            System.out.println("✅ FavoriteController: университет добавлен успешно");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Ошибка добавления университета в избранное: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @DeleteMapping("/university/{universityId}")
    public ResponseEntity<Void> removeFavoriteUniversity(
            Authentication authentication,
            @PathVariable Long universityId
    ) {
        try {
            String email = authentication.getName();
            System.out.println("📧 FavoriteController: удаляем университет " + universityId + " для пользователя " + email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.removeFavoriteUniversity(user.getId(), universityId);
            System.out.println("✅ FavoriteController: университет удален успешно");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Ошибка удаления университета из избранного: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/program/{programId}")
    public ResponseEntity<Void> addFavoriteProgram(
            Authentication authentication,
            @PathVariable Long programId
    ) {
        try {
            String email = authentication.getName();
            System.out.println("📧 FavoriteController: добавляем программу " + programId + " для пользователя " + email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.addFavoriteProgram(user.getId(), programId);
            System.out.println("✅ FavoriteController: программа добавлена успешно");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Ошибка добавления программы в избранное: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @DeleteMapping("/program/{programId}")
    public ResponseEntity<Void> removeFavoriteProgram(
            Authentication authentication,
            @PathVariable Long programId
    ) {
        try {
            String email = authentication.getName();
            System.out.println("📧 FavoriteController: удаляем программу " + programId + " для пользователя " + email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userService.removeFavoriteProgram(user.getId(), programId);
            System.out.println("✅ FavoriteController: программа удалена успешно");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("❌ Ошибка удаления программы из избранного: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}