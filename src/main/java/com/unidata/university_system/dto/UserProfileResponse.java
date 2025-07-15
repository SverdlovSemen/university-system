package com.unidata.university_system.dto;

import java.util.Set;

public record UserProfileResponse(
        Long id,
        String username,
        Boolean enabled,
        Set<String> roles,
        Set<UniversityResponse> favoriteUniversities,
        Set<SpecialtyResponse> favoriteSpecialties
) {}