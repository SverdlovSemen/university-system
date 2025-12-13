package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "program_subjects")
@Getter
@Setter
public class ProgramSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "admission_condition_id")
    private AdmissionCondition admissionCondition;

    @ManyToOne
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "exam_number", nullable = false)
    private Integer examNumber;

    @Column(name = "min_score")
    private BigDecimal minScore;
}

