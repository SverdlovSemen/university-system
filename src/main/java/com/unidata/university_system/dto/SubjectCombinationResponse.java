package com.unidata.university_system.dto;

import java.util.List;

public record SubjectCombinationResponse(
        Long id,
        SpecialtyResponse specialty,
        List<SubjectResponse> subjects
) {
}