package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.UserProfileResponse;
import com.unidata.university_system.mapper.UniversityMapper;
import com.unidata.university_system.models.User;
import com.unidata.university_system.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;
    private final UniversityMapper universityMapper;

    @GetMapping("/me")
    public UserProfileResponse getUserProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.isEnabled(),
                user.getRole() != null ? Set.of(user.getRole().getName()) : Set.of(),
                userService.getFavoriteUniversities(user.getId()).stream()
                        .map(universityMapper::fromUniversity)
                        .collect(Collectors.toSet()),
                Set.of() // Программы пока не маппятся, возвращаем пустой Set
        );
    }
}