package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;

public record FacultyRequest(
        Long id,
        @NotBlank(message = "Full name must not be empty")
        String fullName,
        String abbreviation,
        Long universityId,
        String deanName,
        String deanContacts,
        String address,
        String email,
        String phone
) {
}