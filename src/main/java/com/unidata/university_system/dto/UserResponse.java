package com.unidata.university_system.dto;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String role,
        String status,
        Boolean enabled
) {}