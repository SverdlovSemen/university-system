package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SubjectCombinationRequest(
        @NotNull(message = "SubjectCombination ID must be provided")
        Long id,
        @NotNull(message = "Specialty ID must be provided")
        Long specialtyId, // Заменили SpecialtyRequest на Long
        @NotEmpty(message = "At least one subject must be provided")
        List<SubjectRequest> subjects
) {
}