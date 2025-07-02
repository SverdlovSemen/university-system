package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "university")
@Getter
@Setter
public class University {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "avg_ege_score")
    private Double avgEgeScore;

    @Column(name = "country_ranking")
    private Integer countryRanking;

    @ManyToOne
    @JoinColumn(name = "city_id", nullable = false)
    private City city;
}