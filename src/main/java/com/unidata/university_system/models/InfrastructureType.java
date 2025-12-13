package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "infrastructure_types")
@Getter
@Setter
public class InfrastructureType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", unique = true, nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @OneToMany(mappedBy = "type", cascade = CascadeType.ALL)
    private List<Infrastructure> infrastructures = new ArrayList<>();
}

