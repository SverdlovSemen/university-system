package com.unidata.university_system.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ProgramSubjectsUpdateRequest(
        @NotEmpty(message = "Список предметов не может быть пустым")
        @Valid
        List<ProgramSubjectRequest> subjects
) {
}

