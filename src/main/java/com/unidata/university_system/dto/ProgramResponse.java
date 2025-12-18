package com.unidata.university_system.dto;

import java.util.List;

public record ProgramResponse(
        Long id,
        FacultyShortResponse faculty,
        SpecialtyShortResponse specialty,
        String programDescription,
        String studyForm,
        Long studyFormId,
        String duration,
        boolean mobilityOption,
        String teachingLanguage,
        List<AdmissionConditionResponse> admissionConditions,
        List<SubjectResponse> subjects,
        List<DisciplineResponse> disciplines
) {
}