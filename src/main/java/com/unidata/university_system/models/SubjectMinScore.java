package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "subject_min_scores")
@Getter
@Setter
public class SubjectMinScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "min_score", nullable = false)
    private Integer minScore;
}

