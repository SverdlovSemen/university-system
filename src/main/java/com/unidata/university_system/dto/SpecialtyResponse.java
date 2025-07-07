package com.unidata.university_system.dto;

import java.util.List;

public record SpecialtyResponse(
        Long id,
        String name,
        String programCode,
        String description,
        Long facultyId, // Заменили FacultyResponse на Long, чтобы избежать рекурсии
        List<SubjectCombinationResponse> subjectCombinations
) {
}