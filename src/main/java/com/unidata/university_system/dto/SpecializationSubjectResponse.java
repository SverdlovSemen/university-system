package com.unidata.university_system.dto;

public record SpecializationSubjectResponse(
        Long subjectId,
        String subjectName,
        Boolean isRequired,
        Integer minScoreForYear // минимальный балл для предмета в определённом году
) {
}

