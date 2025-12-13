package com.unidata.university_system.models;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@EqualsAndHashCode
public class SpecializationSubjectId implements Serializable {
    private Long specializationId;
    private Long subjectId;
}

