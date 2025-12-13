package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "university_ratings")
@Getter
@Setter
public class UniversityRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "position", nullable = false)
    private Integer position;
}

