package com.unidata.university_system.controllers;

import com.unidata.university_system.models.User;
import com.unidata.university_system.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final UserService userService;

    @PostMapping("/university/{universityId}")
    public ResponseEntity<Void> addFavoriteUniversity(
            Authentication authentication,
            @PathVariable Long universityId
    ) {
        User user = (User) authentication.getPrincipal();
        userService.addFavoriteUniversity(user.getId(), universityId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/university/{universityId}")
    public ResponseEntity<Void> removeFavoriteUniversity(
            Authentication authentication,
            @PathVariable Long universityId
    ) {
        User user = (User) authentication.getPrincipal();
        userService.removeFavoriteUniversity(user.getId(), universityId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/specialty/{specialtyId}")
    public ResponseEntity<Void> addFavoriteSpecialty(
            Authentication authentication,
            @PathVariable Long specialtyId
    ) {
        User user = (User) authentication.getPrincipal();
        userService.addFavoriteSpecialty(user.getId(), specialtyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/specialty/{specialtyId}")
    public ResponseEntity<Void> removeFavoriteSpecialty(
            Authentication authentication,
            @PathVariable Long specialtyId
    ) {
        User user = (User) authentication.getPrincipal();
        userService.removeFavoriteSpecialty(user.getId(), specialtyId);
        return ResponseEntity.ok().build();
    }
}