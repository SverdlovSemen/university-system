package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record UserRequest(
        @NotNull(message = "User ID must be provided")
        Long id,
        @NotBlank(message = "Username must not be empty")
        String username,
        @NotBlank(message = "Password must not be empty")
        String password,
        @NotNull(message = "Enabled status must be provided")
        Boolean enabled,
        @NotEmpty(message = "At least one role must be provided")
        Set<RoleRequest> roles
) {
}