package com.unidata.university_system.dto;

public record CityResponse(
        Long id,
        String name,
        RegionResponse region
) {
}