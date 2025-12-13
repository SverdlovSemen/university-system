package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "specialization_subjects")
@IdClass(SpecializationSubjectId.class)
@Getter
@Setter
public class SpecializationSubject {
    @Id
    @Column(name = "specialization_id", nullable = false)
    private Long specializationId;

    @Id
    @Column(name = "subject_id", nullable = false)
    private Long subjectId;

    @ManyToOne
    @JoinColumn(name = "specialization_id", insertable = false, updatable = false)
    private Specialty specialization;

    @ManyToOne
    @JoinColumn(name = "subject_id", insertable = false, updatable = false)
    private Subject subject;

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired;
}

