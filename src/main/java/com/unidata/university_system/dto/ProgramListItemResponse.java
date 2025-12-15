package com.unidata.university_system.dto;

public record ProgramListItemResponse(
        Long id,
        FacultyShortResponse faculty,
        SpecialtyShortResponse specialty
) {}

