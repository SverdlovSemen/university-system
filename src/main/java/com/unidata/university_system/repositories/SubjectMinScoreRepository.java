package com.unidata.university_system.repositories;

import com.unidata.university_system.models.SubjectMinScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubjectMinScoreRepository extends JpaRepository<SubjectMinScore, Long> {
    Optional<SubjectMinScore> findBySubjectIdAndYear(Long subjectId, Integer year);
}

