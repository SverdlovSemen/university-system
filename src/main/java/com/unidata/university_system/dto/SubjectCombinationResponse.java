package com.unidata.university_system.dto;

import java.util.List;

public record SubjectCombinationResponse(
        Long id,
        Long specialtyId, // Заменили SpecialtyResponse на Long
        List<SubjectResponse> subjects
) {
}