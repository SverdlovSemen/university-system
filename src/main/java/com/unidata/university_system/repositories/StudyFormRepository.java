package com.unidata.university_system.repositories;

import com.unidata.university_system.models.StudyForm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudyFormRepository extends JpaRepository<StudyForm, Long> {
    Optional<StudyForm> findByName(String name);
}

