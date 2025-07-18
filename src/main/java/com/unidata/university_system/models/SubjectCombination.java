package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "subject_combination")
@Getter
@Setter
public class SubjectCombination {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;

    @ManyToMany
    @JoinTable(
            name = "required_subject", // Updated to match the database table
            joinColumns = @JoinColumn(name = "combination_id"), // Matches `required_subject.combination_id`
            inverseJoinColumns = @JoinColumn(name = "subject_id") // Matches `required_subject.subject_id`
    )
    private List<Subject> subjects;
}