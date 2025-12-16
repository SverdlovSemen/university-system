package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Discipline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisciplineRepository extends JpaRepository<Discipline, Long> {
    List<Discipline> findByProgramIdOrderBySemesterAsc(Long programId);
}

