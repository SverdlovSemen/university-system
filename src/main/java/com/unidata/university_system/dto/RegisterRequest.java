package com.unidata.university_system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Требуется email")
        @Email(message = "Email должен быть валидным")
        String email,

        @NotBlank(message = "Требуется пароль")
        @Size(min = 6, max = 100, message = "Пароль должен быть от 6 до 100 символов")
        String password,

        @NotBlank(message = "Требуется имя")
        @Size(min = 1, max = 255, message = "Имя должно быть от 1 до 255 символов")
        String firstName
) {}