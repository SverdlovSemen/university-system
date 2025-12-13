package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    List<Program> findByFacultyId(Long facultyId);
    List<Program> findByFacultyUniversityId(Long universityId);
    List<Program> findBySpecializationId(Long specializationId);
}


