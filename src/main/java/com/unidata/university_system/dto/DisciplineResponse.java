package com.unidata.university_system.dto;

public record DisciplineResponse(
        Long id,
        String name,
        Integer semester,
        Integer totalHours
) {
}

