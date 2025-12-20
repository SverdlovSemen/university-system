package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    List<Faculty> findByUniversityId(Long universityId);

    @Modifying
    @Query(value = "CALL safe_move_programs_and_delete_faculty(:sourceFacultyId, :targetFacultyId, :validateUniversityMatch)", nativeQuery = true)
    void safeMoveAndDeleteFaculty(
            @Param("sourceFacultyId") Long sourceFacultyId,
            @Param("targetFacultyId") Long targetFacultyId,
            @Param("validateUniversityMatch") Boolean validateUniversityMatch
    );
}