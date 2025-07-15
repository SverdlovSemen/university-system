package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {

    // Найти специальности по ID факультета
    @Query("SELECT s FROM Specialty s JOIN s.faculties f WHERE f.id = :facultyId")
    List<Specialty> findByFacultiesId(@Param("facultyId") Long facultyId);

    // Найти специальности по ID университета
    @Query("SELECT DISTINCT s FROM Specialty s JOIN s.faculties f JOIN f.university u WHERE u.id = :universityId")
    List<Specialty> findByFacultiesUniversityId(@Param("universityId") Long universityId);

    // Обновлённый метод поиска с учётом новой структуры
    @Query(value = "SELECT DISTINCT s.* FROM specialty s " +
            "JOIN faculty_specialty fs ON s.id = fs.specialty_id " +
            "JOIN faculty f ON f.id = fs.faculty_id " +
            "LEFT JOIN subject_combination sc ON s.id = sc.specialty_id " +
            "LEFT JOIN required_subject rs ON sc.id = rs.combination_id " +
            "LEFT JOIN subject subj ON subj.id = rs.subject_id " +
            "WHERE " +
            "(:universityId IS NULL OR f.university_id = :universityId) " +
            "AND (:query IS NULL OR " +
            "   LOWER(s.name) LIKE '%' || LOWER(CAST(:query AS TEXT)) || '%' OR " +
            "   LOWER(s.program_code) LIKE '%' || LOWER(CAST(:query AS TEXT)) || '%') " +
            "AND (:level IS NULL OR s.program_code LIKE CAST(:level AS TEXT) || '%') " +
            "AND (:form IS NULL OR s.description LIKE '%' || CAST(:form AS TEXT) || '%') " +
            "AND (:subject IS NULL OR subj.name = CAST(:subject AS TEXT))",
            nativeQuery = true)
    List<Specialty> searchSpecialties(
            @Param("universityId") Long universityId,
            @Param("query") String query,
            @Param("level") String level,
            @Param("form") String form,
            @Param("subject") String subject);
}