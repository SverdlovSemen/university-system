package com.unidata.university_system.dto;

import java.util.Set;

public record FavoritesResponse(
        Set<UniversityResponse> universities,
        Set<SpecialtyResponse> specialties
) {}