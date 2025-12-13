package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programs")
@Getter
@Setter
public class Program {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @ManyToOne
    @JoinColumn(name = "specialization_id")
    private Specialty specialization;

    @Column(name = "teaching_language")
    private String teachingLanguage;

    @Column(name = "program_description", columnDefinition = "TEXT")
    private String programDescription;

    @ManyToOne
    @JoinColumn(name = "study_form_id")
    private StudyForm studyForm;

    @Column(name = "duration")
    private String duration;

    @Column(name = "mobility_option")
    private Boolean mobilityOption;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AdmissionCondition> admissionConditions = new ArrayList<>();

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Discipline> disciplines = new ArrayList<>();
}

