package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegionRequest(
        @NotNull(message = "Region ID must be provided")
        Long id,
        @NotBlank(message = "Region name must not be empty")
        String name
) {
}