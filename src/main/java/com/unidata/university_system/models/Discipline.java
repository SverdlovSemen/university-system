package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "disciplines")
@Getter
@Setter
public class Discipline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "semester", nullable = false)
    private Integer semester;

    @Column(name = "total_hours", nullable = false)
    private Integer totalHours;
}

