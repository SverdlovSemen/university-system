package com.unidata.university_system.repositories;

import com.unidata.university_system.models.RequiredSubject;
import com.unidata.university_system.models.RequiredSubjectId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequiredSubjectRepository extends JpaRepository<RequiredSubject, RequiredSubjectId> {
    boolean existsById(RequiredSubjectId id);
}