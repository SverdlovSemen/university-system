package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AdmissionConditionRequest(
        @NotNull(message = "Год обязателен")
        Integer year,
        BigDecimal passingScore,
        Integer budgetPlaces,
        Integer targetedPlaces,
        Integer paidPlaces,
        BigDecimal admissionFee,
        Boolean hasDvi
) {
}

