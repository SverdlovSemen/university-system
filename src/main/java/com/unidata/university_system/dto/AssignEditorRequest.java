package com.unidata.university_system.dto;

public record AssignEditorRequest(
        Long userId,
        Long universityId // optional, may be null
) {}
