package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "admission_conditions")
@Getter
@Setter
public class AdmissionCondition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @Column(name = "admission_fee")
    private BigDecimal admissionFee;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "passing_score")
    private BigDecimal passingScore;

    @Column(name = "has_dvi")
    private Boolean hasDvi;

    @Column(name = "budget_places")
    private Integer budgetPlaces;

    @Column(name = "targeted_places")
    private Integer targetedPlaces;

    @Column(name = "paid_places")
    private Integer paidPlaces;

    @OneToMany(mappedBy = "admissionCondition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProgramSubject> programSubjects = new ArrayList<>();
}

