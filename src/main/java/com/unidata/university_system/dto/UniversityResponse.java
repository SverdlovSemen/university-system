package com.unidata.university_system.dto;

import java.time.LocalDate;
import java.util.List;

public record UniversityResponse(
        Long id,
        String fullName,
        String abbreviation,
        String type,
        String ownershipType,
        CityResponse city,
        Integer foundedYear,
        String website,
        String adminEmail,
        String adminPhone,
        String accreditationNumber,
        LocalDate accreditationExpiryDate,
        String status,
        List<FacultyResponse> faculties
) {
}