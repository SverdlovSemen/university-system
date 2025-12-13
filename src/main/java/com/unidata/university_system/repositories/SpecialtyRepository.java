package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {

    @Query("""
            SELECT DISTINCT s
            FROM Program p
            JOIN p.specialization s
            WHERE p.faculty.id = :facultyId
            """)
    List<Specialty> findByFacultyId(@Param("facultyId") Long facultyId);

    @Query("""
            SELECT DISTINCT s
            FROM Program p
            JOIN p.specialization s
            JOIN p.faculty f
            WHERE f.university.id = :universityId
            """)
    List<Specialty> findByUniversityId(@Param("universityId") Long universityId);

    @Query("""
            SELECT DISTINCT s
            FROM Program p
            JOIN p.specialization s
            LEFT JOIN s.educationLevel el
            LEFT JOIN p.studyForm sf
            LEFT JOIN s.specializationSubjects ss
            LEFT JOIN ss.subject subj
            WHERE (:universityId IS NULL OR p.faculty.university.id = :universityId)
              AND (:query IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(s.programCode) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:level IS NULL OR LOWER(el.name) = LOWER(:level))
              AND (:form IS NULL OR LOWER(sf.name) = LOWER(:form))
              AND (:subject IS NULL OR LOWER(subj.name) = LOWER(:subject))
            """)
    List<Specialty> searchSpecialties(
            @Param("universityId") Long universityId,
            @Param("query") String query,
            @Param("level") String level,
            @Param("form") String form,
            @Param("subject") String subject);
}