package com.unidata.university_system.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/login")
    public ResponseEntity<String> showLoginForm() {
        return ResponseEntity.ok("Please enter your credentials.");
    }

    @PostMapping("/authenticate")
    public ResponseEntity<String> authenticateUser(@RequestParam String username, @RequestParam String password) {
        // Здесь логика проверки пользователя и возврата токена (если применимо)
        return ResponseEntity.ok("Logged in successfully!");
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<String> currentUserInfo() {
        return ResponseEntity.ok("You are logged in as an authenticated user.");
    }
}