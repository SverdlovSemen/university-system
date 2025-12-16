package com.unidata.university_system.dto;

public record InfrastructureResponse(
        Long id,
        String name,
        String description,
        String address,
        InfrastructureTypeResponse type
) {
}

