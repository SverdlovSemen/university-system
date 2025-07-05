package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubjectRequest(
        @NotNull(message = "Subject ID must be provided")
        Long id,
        @NotBlank(message = "Subject name must not be empty")
        String name
) {
}