package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    List<Specialty> findByFacultyId(Long facultyId);

    // Поиск программ по вузу (через факультеты)
    @Query("SELECT s FROM Specialty s WHERE s.faculty.university.id = :universityId")
    List<Specialty> findByUniversityId(@Param("universityId") Long universityId);

    @Query(value = "SELECT DISTINCT s.* FROM specialty s " +
            "LEFT JOIN subject_combination sc ON s.id = sc.specialty_id " +
            "LEFT JOIN required_subject rs ON sc.id = rs.combination_id " +
            "LEFT JOIN subject subj ON subj.id = rs.subject_id " +
            "JOIN faculty f ON f.id = s.faculty_id " +
            "WHERE " +
            "(:universityId IS NULL OR f.university_id = :universityId) " +
            "AND (:query IS NULL OR " +
            "   LOWER(s.name) LIKE '%' || LOWER(CAST(:query AS TEXT)) || '%' OR " + // Добавлен CAST
            "   LOWER(s.program_code) LIKE '%' || LOWER(CAST(:query AS TEXT)) || '%') " + // Добавлен CAST
            "AND (:level IS NULL OR s.program_code LIKE CAST(:level AS TEXT) || '%') " + // Добавлен CAST
            "AND (:form IS NULL OR s.description LIKE '%' || CAST(:form AS TEXT) || '%') " + // Добавлен CAST
            "AND (:subject IS NULL OR subj.name = CAST(:subject AS TEXT))", // Добавлен CAST
            nativeQuery = true)
    List<Specialty> searchSpecialties(
            @Param("universityId") Long universityId,
            @Param("query") String query,
            @Param("level") String level,
            @Param("form") String form,
            @Param("subject") String subject);
}