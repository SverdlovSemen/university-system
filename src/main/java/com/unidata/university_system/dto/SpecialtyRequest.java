package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SpecialtyRequest(
        Long id,
        @NotBlank(message = "Specialty name must not be empty")
        String name,
        @NotBlank(message = "Program code must not be empty")
        String programCode,
        String description,
        Long educationLevelId,
        List<Long> facultyIds,
        List<SubjectCombinationRequest> subjectCombinations
) {
}