package com.unidata.university_system.repositories;

import com.unidata.university_system.models.UniversityEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniversityEmployeeRepository extends JpaRepository<UniversityEmployee, Long> {
    boolean existsByUniversityIdAndUserId(Long universityId, Long userId);
}
