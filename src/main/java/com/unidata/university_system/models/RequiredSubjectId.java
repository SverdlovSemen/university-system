package com.unidata.university_system.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@EqualsAndHashCode
public class RequiredSubjectId implements Serializable {

    private Long combinationId;
    private Long subjectId;

    // Default constructor
    public RequiredSubjectId() {
    }

    // Constructor for creating the key
    public RequiredSubjectId(Long combinationId, Long subjectId) {
        this.combinationId = combinationId;
        this.subjectId = subjectId;
    }
}