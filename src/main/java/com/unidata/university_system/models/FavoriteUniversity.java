package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_universities")
@IdClass(FavoriteUniversityId.class)
@Getter
@Setter
public class FavoriteUniversity {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "university_id", nullable = false)
    private Long universityId;

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "university_id", insertable = false, updatable = false)
    private University university;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

