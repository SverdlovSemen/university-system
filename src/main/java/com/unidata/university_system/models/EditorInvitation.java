package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "editor_invitations")
@Getter
@Setter
public class EditorInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "university_id")
    private University university;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "token", unique = true, nullable = false)
    private String token;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}

