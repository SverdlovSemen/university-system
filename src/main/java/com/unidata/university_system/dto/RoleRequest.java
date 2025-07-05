package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoleRequest(
        @NotNull(message = "Role ID must be provided")
        Long id,
        @NotBlank(message = "Role name must not be empty")
        String roleName
) {
}