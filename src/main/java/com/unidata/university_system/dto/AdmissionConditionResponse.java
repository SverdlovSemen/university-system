package com.unidata.university_system.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdmissionConditionResponse(
        Integer year,
        BigDecimal passingScore,
        Integer budgetPlaces,
        Integer targetedPlaces,
        Integer paidPlaces,
        List<SubjectResponse> subjects
) {
}
