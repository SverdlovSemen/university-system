package com.unidata.university_system.repositories;

import com.unidata.university_system.models.SpecializationSubject;
import com.unidata.university_system.models.SpecializationSubjectId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpecializationSubjectRepository extends JpaRepository<SpecializationSubject, SpecializationSubjectId> {
    List<SpecializationSubject> findBySpecializationId(Long specializationId);
    void deleteBySpecializationId(Long specializationId);
}


