package com.unidata.university_system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProgramSubjectRequest(
        @NotNull(message = "ID предмета обязателен")
        Long subjectId,

        @NotNull(message = "Приоритет (номер экзамена) обязателен")
        @Min(value = 1, message = "Приоритет должен быть от 1 до 5")
        @Max(value = 5, message = "Приоритет должен быть от 1 до 5")
        Integer examNumber,

        @Min(value = 0, message = "Минимальный балл не может быть меньше 0")
        @Max(value = 100, message = "Минимальный балл не может быть больше 100")
        BigDecimal minScore
) {
}

