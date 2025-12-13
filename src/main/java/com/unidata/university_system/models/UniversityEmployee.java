package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "university_employees")
@IdClass(UniversityEmployeeId.class)
@Getter
@Setter
public class UniversityEmployee {
    @Id
    @Column(name = "university_id", nullable = false)
    private Long universityId;

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne
    @JoinColumn(name = "university_id", insertable = false, updatable = false)
    private University university;

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}

