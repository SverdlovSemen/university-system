package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "specializations")
@Getter
@Setter
public class Specialty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String programCode;

    @Column(name = "name", nullable = false)
    private String name;

    // Поле direction в новой схеме — используем вместо старого description
    @Column(name = "direction", nullable = false)
    private String description;

    @ManyToOne
    @JoinColumn(name = "education_level_id")
    private EducationLevel educationLevel;

    @OneToMany(mappedBy = "specialization", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Program> programs = new ArrayList<>();

    @OneToMany(mappedBy = "specialization", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<SpecializationSubject> specializationSubjects = new HashSet<>();
}