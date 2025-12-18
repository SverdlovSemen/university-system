package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DisciplineRequest(
        @NotBlank(message = "Название дисциплины обязательно")
        String name,

        @NotNull(message = "Семестр обязателен")
        @Positive(message = "Семестр должен быть положительным числом")
        Integer semester,

        @NotNull(message = "Количество часов обязательно")
        @Positive(message = "Количество часов должно быть положительным числом")
        Integer totalHours
) {
}

