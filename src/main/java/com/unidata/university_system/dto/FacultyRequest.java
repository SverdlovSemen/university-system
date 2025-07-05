package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FacultyRequest(
        @NotNull(message = "Faculty ID must be provided")
        Long id,
        @NotBlank(message = "Faculty name must not be empty")
        String name,
        List<SpecialtyRequest> specialties
) {
}