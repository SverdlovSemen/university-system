package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SubjectCombinationRequest(
        Long id,
        Long specialtyId,
        @NotEmpty(message = "At least one subject must be provided")
        List<SubjectRequest> subjects
) {
}