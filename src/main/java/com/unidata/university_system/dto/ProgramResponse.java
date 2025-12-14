package com.unidata.university_system.dto;

import java.util.List;

public record ProgramResponse(
        Long id,
        Long facultyId,
        String facultyName,
        Long universityId,
        String universityShortName,
        String programDescription,
        String studyForm,
        String duration,
        List<AdmissionConditionResponse> admissionConditions,
        List<SubjectResponse> subjects
) {
}