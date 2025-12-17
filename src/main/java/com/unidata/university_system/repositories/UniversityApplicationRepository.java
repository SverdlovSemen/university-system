package com.unidata.university_system.repositories;

import com.unidata.university_system.models.UniversityApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniversityApplicationRepository extends JpaRepository<UniversityApplication, Long> {
    List<UniversityApplication> findByUserId(Long userId);
    List<UniversityApplication> findByStatusId(Long statusId);
}

