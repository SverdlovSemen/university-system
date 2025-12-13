package com.unidata.university_system.dto;

public record FacultyResponse(
        Long id,
        String fullName,
        String abbreviation,
        Long universityId,
        String deanName,
        String deanContacts,
        String address,
        String email,
        String phone
) {
}