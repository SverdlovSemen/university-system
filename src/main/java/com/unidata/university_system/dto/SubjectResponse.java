package com.unidata.university_system.dto;

import java.math.BigDecimal;

public record SubjectResponse(
        Long id,
        String name,
        Integer examNumber,
        BigDecimal minScore
) {
}