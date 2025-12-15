package com.unidata.university_system.dto;

public record SpecialtyShortResponse(
        Long id,
        String name,
        String programCode,
        String educationLevel // Новое поле для уровня образования
) {}

