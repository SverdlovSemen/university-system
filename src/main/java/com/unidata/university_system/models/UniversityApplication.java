package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "university_applications")
@Getter
@Setter
public class UniversityApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "abbreviation")
    private String abbreviation;

    @Column(name = "website")
    private String website;

    @Column(name = "contact_person_name", nullable = false)
    private String contactPersonName;

    @Column(name = "contact_person_position")
    private String contactPersonPosition;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private ApplicationStatus status;

    @ManyToOne
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}

