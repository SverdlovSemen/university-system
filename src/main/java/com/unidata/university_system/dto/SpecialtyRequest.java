package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SpecialtyRequest(
        @NotNull(message = "Specialty ID must be provided")
        Long id,
        @NotBlank(message = "Specialty name must not be empty")
        String name,
        @NotBlank(message = "Program code must not be empty")
        String programCode,
        String description,
        @NotNull(message = "Faculty ID must be provided")
        Long facultyId, // Заменили String faculty на Long facultyId
        List<SubjectCombinationRequest> subjectCombinations
) {
}