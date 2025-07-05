package com.unidata.university_system.dto;

import java.util.List;

public record UniversityResponse(
        Long id,
        String name,
        String type,
        Double avgEgeScore,
        Integer countryRanking,
        CityResponse city,
        List<FacultyResponse> faculties
) {
}