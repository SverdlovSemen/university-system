package com.unidata.university_system.repositories;

import com.unidata.university_system.models.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UniversityRepository extends JpaRepository<University, Long> {
    // Поиск по названию (частичное совпадение, регистр не важен)
    List<University> findByNameContainingIgnoreCase(String name);

    // Поиск по названию и ID города (регистр не важен)
    Optional<University> findByNameIgnoreCaseAndCityId(String name, Long cityId);

    // Фильтрация по региону
    @Query("SELECT u FROM University u WHERE u.city.region.name = :regionName")
    List<University> findByRegionName(@Param("regionName") String regionName);

    // Фильтрация по типу
    List<University> findByType(String type);

    // Комбинированный поиск
    @Query("SELECT u FROM University u WHERE " +
            "(:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:region IS NULL OR u.city.region.name = :region) AND " +
            "(:type IS NULL OR u.type = :type)")
    List<University> search(
            @Param("name") String name,
            @Param("region") String region,
            @Param("type") String type
    );

    // Поиск университетов по специальности
    @Query("SELECT DISTINCT u FROM University u " +
            "JOIN u.faculties f " +
            "JOIN f.specialties s " +
            "WHERE (:specialtyIds IS NULL OR s.id IN :specialtyIds) " +
            "ORDER BY u.countryRanking ASC")
    List<University> findBySpecialties(@Param("specialtyIds") List<Long> specialtyIds);

    //Поиск с фильтрами

    @Query("SELECT DISTINCT u FROM University u " +
            "LEFT JOIN u.faculties f " +
            "LEFT JOIN f.specialties s " +
            "WHERE (:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) " +
            "AND (:regionId IS NULL OR u.city.region.id = :regionId) " +
            "AND (:type IS NULL OR u.type = :type) " +
            "AND (:minScore IS NULL OR u.avgEgeScore >= :minScore) " +
            "AND (:maxScore IS NULL OR u.avgEgeScore <= :maxScore) " +
            "AND (:specialtyIds IS NULL OR s.id IN :specialtyIds) " +
            "ORDER BY u.countryRanking ASC")
    List<University> searchWithFilters(
            @Param("name") String name,
            @Param("regionId") Long regionId,
            @Param("type") String type,
            @Param("minScore") Double minScore,
            @Param("maxScore") Double maxScore,
            @Param("specialtyIds") List<Long> specialtyIds);

    // Методы для аналитики
    @Query("SELECT COUNT(u) FROM University u")
    Long getUniversitiesCount();

    @Query("SELECT u.city.region.name, COUNT(u) FROM University u GROUP BY u.city.region.name")
    List<Object[]> getUniversitiesByRegion();
}