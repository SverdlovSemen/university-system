package com.unidata.university_system.repositories;

import com.unidata.university_system.models.ProgramSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgramSubjectRepository extends JpaRepository<ProgramSubject, Long> {
    List<ProgramSubject> findByAdmissionConditionId(Long admissionConditionId);
}

