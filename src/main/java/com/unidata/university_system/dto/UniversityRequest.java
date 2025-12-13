package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record UniversityRequest(
        Long id,
        @NotBlank(message = "Full name must not be empty")
        String fullName,
        @NotBlank(message = "Abbreviation must not be empty")
        String abbreviation,
        @NotBlank(message = "Type must not be empty")
        String type,
        String ownershipType,
        Long cityId,
        Integer foundedYear,
        String website,
        String adminEmail,
        String adminPhone,
        String accreditationNumber,
        LocalDate accreditationExpiryDate
) {
}