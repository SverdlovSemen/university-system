package com.unidata.university_system.dto;

import java.util.List;

public record FacultyResponse(
        Long id,
        String name,
        UniversityResponse university, // Will be null
        List<SpecialtyResponse> specialties
) {
}