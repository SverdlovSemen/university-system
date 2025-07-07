package com.unidata.university_system.dto;

import java.util.List;

public record FacultyResponse(
        Long id,
        String name,
        Long universityId, // Изменили с UniversityResponse на Long, чтобы избежать рекурсии
        List<SpecialtyResponse> specialties
) {
}