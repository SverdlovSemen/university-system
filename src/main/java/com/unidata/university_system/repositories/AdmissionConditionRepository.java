package com.unidata.university_system.repositories;

import com.unidata.university_system.models.AdmissionCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdmissionConditionRepository extends JpaRepository<AdmissionCondition, Long> {
    Optional<AdmissionCondition> findByProgramIdAndYear(Long programId, Integer year);
}
