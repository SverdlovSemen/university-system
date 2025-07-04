package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Faculty;
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

    // Фильтрация по уровню образования, форме обучения, предметам ЕГЭ (расширяемый пример)
    @Query("SELECT DISTINCT s FROM Specialty s " +
            "LEFT JOIN s.subjectCombinations sc " +
            "LEFT JOIN sc.subjects subj " +
            "WHERE (:universityId IS NULL OR s.faculty.university.id = :universityId) " +
            "AND (:level IS NULL OR s.programCode LIKE CONCAT(:level, '%')) " +
            "AND (:form IS NULL OR s.description LIKE CONCAT('%', :form, '%')) " +
            "AND (:subject IS NULL OR subj.name = :subject)")
    List<Specialty> searchSpecialties(@Param("universityId") Long universityId,
                                      @Param("level") String level,
                                      @Param("form") String form,
                                      @Param("subject") String subject);
}