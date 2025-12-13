package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "university_statistics")
@Getter
@Setter
public class UniversityStatistics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "student_count")
    private Integer studentCount;

    @Column(name = "teacher_count")
    private Integer teacherCount;
}

