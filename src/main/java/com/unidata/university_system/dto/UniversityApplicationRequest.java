package com.unidata.university_system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UniversityApplicationRequest {
    @NotBlank(message = "Полное название университета обязательно")
    private String fullName;

    private String abbreviation;

    private String website;

    @NotBlank(message = "Имя контактного лица обязательно")
    private String contactPersonName;

    private String contactPersonPosition;

    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный формат email")
    private String contactEmail;

    private String contactPhone;
}

