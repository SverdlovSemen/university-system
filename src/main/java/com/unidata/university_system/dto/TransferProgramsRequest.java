package com.unidata.university_system.dto;

import jakarta.validation.constraints.NotNull;

public class TransferProgramsRequest {
    @NotNull(message = "Исходный факультет не указан")
    private Long sourceFacultyId;

    @NotNull(message = "Целевой факультет не указан")
    private Long targetFacultyId;

    public TransferProgramsRequest() {
    }

    public TransferProgramsRequest(Long sourceFacultyId, Long targetFacultyId) {
        this.sourceFacultyId = sourceFacultyId;
        this.targetFacultyId = targetFacultyId;
    }

    public Long getSourceFacultyId() {
        return sourceFacultyId;
    }

    public void setSourceFacultyId(Long sourceFacultyId) {
        this.sourceFacultyId = sourceFacultyId;
    }

    public Long getTargetFacultyId() {
        return targetFacultyId;
    }

    public void setTargetFacultyId(Long targetFacultyId) {
        this.targetFacultyId = targetFacultyId;
    }
}

