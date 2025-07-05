package com.unidata.university_system.dto;

import java.util.Set;

public record UserResponse(
        Long id,
        String username,
        Boolean enabled,
        Set<RoleResponse> roles
) {
}