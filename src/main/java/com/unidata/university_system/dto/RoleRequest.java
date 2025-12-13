package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleRequest(
        Long id,
        @NotBlank(message = "Role name must not be empty")
        String name,
        String description,
        @NotBlank(message = "Permissions must not be empty")
        String permissions
) {
}