package com.unidata.university_system.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "required_subject")
@IdClass(RequiredSubjectId.class)
@Getter
@Setter
public class RequiredSubject {

    @Id
    @Column(name = "combination_id")
    private Long combinationId;

    @Id
    @Column(name = "subject_id")
    private Long subjectId;

    @ManyToOne
    @JoinColumn(name = "combination_id", referencedColumnName = "id", insertable = false, updatable = false)
    private SubjectCombination subjectCombination;

    @ManyToOne
    @JoinColumn(name = "subject_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Subject subject;
}