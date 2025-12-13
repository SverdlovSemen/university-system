package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "favorite_programs")
@IdClass(FavoriteProgramId.class)
@Getter
@Setter
public class FavoriteProgram {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Id
    @Column(name = "program_id", nullable = false)
    private Long programId;

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "program_id", insertable = false, updatable = false)
    private Program program;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

