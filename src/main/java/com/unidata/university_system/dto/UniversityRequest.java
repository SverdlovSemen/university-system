package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record UniversityRequest(
        Long id,

        @NotBlank(message = "Short name must not be empty")
        String shortName,

        @NotBlank(message = "Full name must not be empty")
        String fullName,

        @NotBlank(message = "Type must not be empty")
        String type,

        @PositiveOrZero(message = "Average EGE score must be positive or zero")
        Double avgEgeScore,

        @Positive(message = "Country ranking must be positive")
        Integer countryRanking,

        @NotNull(message = "City must be provided")
        Long cityId
) {
}