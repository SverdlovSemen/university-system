package com.unidata.university_system.dto;

import java.util.List;

public record SpecialtyResponse(
        Long id,
        String name,
        String programCode,
        String description,
        List<Long> facultyIds,
        List<SubjectCombinationResponse> subjectCombinations
) {
}