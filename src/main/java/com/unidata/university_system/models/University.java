package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "universities")
@Getter
@Setter
public class University {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "abbreviation", nullable = false)
    private String abbreviation;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "ownership_type")
    private String ownershipType;

    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city;

    @Column(name = "founded_year")
    private Integer foundedYear;

    @Column(name = "website")
    private String website;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(name = "admin_phone")
    private String adminPhone;

    @Column(name = "accreditation_number")
    private String accreditationNumber;

    @Column(name = "accreditation_expiry_date")
    private LocalDate accreditationExpiryDate;

    @ManyToOne
    @JoinColumn(name = "status_id")
    private UniversityStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Faculty> faculties = new ArrayList<>();

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL)
    private List<EditorInvitation> editorInvitations = new ArrayList<>();

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL)
    private List<UniversityEmployee> employees = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "university_infrastructure",
            joinColumns = @JoinColumn(name = "university_id"),
            inverseJoinColumns = @JoinColumn(name = "infrastructure_id")
    )
    private Set<Infrastructure> infrastructures = new HashSet<>();

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL)
    private List<UniversityRating> ratings = new ArrayList<>();

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL)
    private List<UniversityStatistics> statistics = new ArrayList<>();
}
