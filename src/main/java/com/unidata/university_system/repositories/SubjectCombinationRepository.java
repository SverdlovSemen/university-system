package com.unidata.university_system.repositories;

import com.unidata.university_system.models.SubjectCombination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectCombinationRepository extends JpaRepository<SubjectCombination, Long> {
}