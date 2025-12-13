package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "study_forms")
@Getter
@Setter
public class StudyForm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", unique = true, nullable = false)
    private String name;

    @OneToMany(mappedBy = "studyForm", cascade = CascadeType.ALL)
    private List<Program> programs = new ArrayList<>();
}

