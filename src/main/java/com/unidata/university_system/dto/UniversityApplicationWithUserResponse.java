package com.unidata.university_system.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UniversityApplicationWithUserResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String fullName;
    private String abbreviation;
    private String website;
    private String contactPersonName;
    private String contactPersonPosition;
    private String contactEmail;
    private String contactPhone;
    private String statusName;
    private Long processedBy;
    private LocalDateTime processedAt;
}

