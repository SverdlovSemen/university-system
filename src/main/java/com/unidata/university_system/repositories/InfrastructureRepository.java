package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InfrastructureRepository extends JpaRepository<Infrastructure, Long> {

    @Query("SELECT DISTINCT i FROM Infrastructure i JOIN i.universities u WHERE u.id = :universityId")
    List<Infrastructure> findAllByUniversityId(@Param("universityId") Long universityId);
}
