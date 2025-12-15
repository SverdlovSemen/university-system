 package com.unidata.university_system.dto;

import java.math.BigDecimal;

public record ProgramSubjectResponse(
        Long subjectId,
        String subjectName,
        Integer examNumber,
        BigDecimal minScore
) {
}

