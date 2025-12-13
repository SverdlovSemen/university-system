package com.unidata.university_system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserRequest(
        Long id,
        @NotBlank(message = "Email must not be empty")
        @Email(message = "Email must be valid")
        String email,
        @NotBlank(message = "Password must not be empty")
        String password,
        @NotBlank(message = "First name must not be empty")
        String firstName
) {
}