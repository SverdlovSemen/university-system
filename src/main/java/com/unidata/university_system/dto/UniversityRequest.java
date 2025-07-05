package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record UniversityRequest(
        @NotNull(message = "ID must be provided")
        Long id,
        @NotBlank(message = "Name must not be empty")
        String name,
        @NotBlank(message = "Type must not be empty")
        String type,
        @Positive(message = "Average EGE score must be positive")
        Double avgEgeScore,
        @Positive(message = "Country ranking must be positive")
        Integer countryRanking,
        @NotNull(message = "City must be provided")
        CityRequest city,
        List<FacultyRequest> faculties
) {
}