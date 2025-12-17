package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ProgramRequest(
        @NotNull(message = "facultyId обязательно")
        @PositiveOrZero(message = "facultyId должен быть положительным числом")
        Long facultyId,

        @NotNull(message = "specialtyId обязательно")
        @PositiveOrZero(message = "specialtyId должен быть положительным числом")
        Long specialtyId,

        String programDescription,
        Long studyFormId,
        String duration,
        Boolean mobilityOption,
        String teachingLanguage
) {
}

