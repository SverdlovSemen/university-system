package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CityRequest(
        @NotNull(message = "City ID must be provided")
        Long id,
        @NotBlank(message = "City name must not be empty")
        String name,
        @NotNull(message = "Region must be provided")
        RegionRequest region
) {
}