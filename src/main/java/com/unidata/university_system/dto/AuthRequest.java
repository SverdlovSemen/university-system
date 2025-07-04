package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthRequest(
        @NotBlank(message = "Требуется имя пользователя")
        @Size(min = 3, max = 50, message = "Имя пользователя должно быть от 3 до 50 символов")
        String username,

        @NotBlank(message = "Требуется пароль")
        @Size(min = 6, max = 100, message = "Пароль должен быть от 6 до 100 символов")
        String password
) {}