package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
import com.unidata.university_system.dto.csv.UniversityCsvDTO;
import com.unidata.university_system.mapper.UniversityMapper;
import com.unidata.university_system.models.*;
import com.unidata.university_system.repositories.CityRepository;
import com.unidata.university_system.repositories.UniversityRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UniversityService {

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UniversityMapper universityMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public List<UniversityResponse> getAllUniversities() {
        return universityRepository.findAll().stream()
                .map(universityMapper::fromUniversity)
                .collect(Collectors.toList());
    }

    public Optional<UniversityResponse> getUniversityById(Long id) {
        return universityRepository.findById(id)
                .map(universityMapper::fromUniversity);
    }

    public UniversityResponse createUniversity(UniversityRequest request) {
        University university = universityMapper.toUniversity(request);

        // Проверяем существование города
        City city = cityRepository.findById(request.cityId())
                .orElseThrow(() -> new IllegalArgumentException("City not found: " + request.cityId()));
        university.setCity(city);

        University savedUniversity = universityRepository.save(university);
        return universityMapper.fromUniversity(savedUniversity);
    }

    public List<UniversityResponse> getUniversitiesBySpecialty(Long specialtyId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<University> cq = cb.createQuery(University.class);
        Root<University> universityRoot = cq.from(University.class);

        // Создаем join для связи University → Faculty → Specialty
        Join<University, Faculty> facultyJoin = universityRoot.join("faculties");
        Join<Faculty, Specialty> specialtyJoin = facultyJoin.join("specialties");

        // Условие поиска по ID специальности
        Predicate specialtyPredicate = cb.equal(specialtyJoin.get("id"), specialtyId);

        // Формируем запрос
        cq.select(universityRoot)
                .where(specialtyPredicate)
                .distinct(true); // Убираем дубликаты университетов

        // Выполняем запрос и преобразуем результат
        return entityManager.createQuery(cq)
                .getResultList()
                .stream()
                .map(universityMapper::fromUniversity)
                .collect(Collectors.toList());
    }

    public Optional<UniversityResponse> updateUniversity(Long id, UniversityRequest request) {
        Optional<University> existingUniversity = universityRepository.findById(id);
        if (existingUniversity.isPresent()) {
            University university = existingUniversity.get();

            // Обновляем поля
            university.setShortName(request.shortName());
            university.setFullName(request.fullName());
            university.setType(request.type());
            university.setAvgEgeScore(request.avgEgeScore());
            university.setCountryRanking(request.countryRanking());

            // Обновляем город, если изменился cityId
            if (request.cityId() != null && !request.cityId().equals(university.getCity().getId())) {
                City city = cityRepository.findById(request.cityId())
                        .orElseThrow(() -> new IllegalArgumentException("City not found: " + request.cityId()));
                university.setCity(city);
            }

            University savedUniversity = universityRepository.save(university);
            return Optional.of(universityMapper.fromUniversity(savedUniversity));
        }
        return Optional.empty();
    }

    public boolean deleteUniversity(Long id) {
        if (universityRepository.existsById(id)) {
            universityRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<UniversityResponse> searchUniversitiesByName(String nameQuery, int limit) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<University> cq = cb.createQuery(University.class);
        Root<University> root = cq.from(University.class);

        List<Predicate> predicates = new ArrayList<>();

        if (nameQuery != null && !nameQuery.isEmpty()) {
            String pattern = "%" + nameQuery.toLowerCase() + "%";
            Predicate shortNamePredicate = cb.like(cb.lower(root.get("shortName")), pattern);
            Predicate fullNamePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
            predicates.add(cb.or(shortNamePredicate, fullNamePredicate));
        }

        cq.where(predicates.toArray(new Predicate[0]));
        cq.orderBy(cb.asc(root.get("countryRanking"))); // Сортируем по рейтингу

        return entityManager.createQuery(cq)
                .setMaxResults(limit)
                .getResultList()
                .stream()
                .map(universityMapper::fromUniversity)
                .collect(Collectors.toList());
    }

    public List<UniversityResponse> searchUniversities(
            String nameQuery,
            Long regionId,
            List<Long> subjectIds,
            List<Long> specialtyIds,
            Double minScore,
            Double maxScore) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<University> cq = cb.createQuery(University.class);
        Root<University> universityRoot = cq.from(University.class);

        List<Predicate> predicates = new ArrayList<>();

        //Фильтр по названию
        if (nameQuery != null && !nameQuery.isEmpty()) {
            String pattern = "%" + nameQuery.toLowerCase() + "%";
            Predicate shortNamePredicate = cb.like(cb.lower(universityRoot.get("shortName")), pattern);
            Predicate fullNamePredicate = cb.like(cb.lower(universityRoot.get("fullName")), pattern);
            predicates.add(cb.or(shortNamePredicate, fullNamePredicate));
        }

        // Фильтр по региону
        if (regionId != null) {
            Join<University, City> cityJoin = universityRoot.join("city");
            Join<City, Region> regionJoin = cityJoin.join("region");
            predicates.add(cb.equal(regionJoin.get("id"), regionId));
        }

        // Фильтр по специальностям (исправленный)
        if (specialtyIds != null && !specialtyIds.isEmpty()) {
            // Создаем подзапрос для университетов с нужными специальностями
            Subquery<Long> universitySubquery = cq.subquery(Long.class);
            Root<Faculty> facultyRoot = universitySubquery.from(Faculty.class);
            Join<Faculty, Specialty> specialtyJoin = facultyRoot.join("specialties");

            universitySubquery.select(facultyRoot.get("university").get("id"))
                    .where(specialtyJoin.get("id").in(specialtyIds));

            predicates.add(universityRoot.get("id").in(universitySubquery));
        }

        // Фильтр по предметам
        if (subjectIds != null && !subjectIds.isEmpty()) {
            // Создаем подзапрос для университетов с нужными предметами
            Subquery<Long> subjectSubquery = cq.subquery(Long.class);
            Root<SubjectCombination> combinationRoot = subjectSubquery.from(SubjectCombination.class);
            Join<SubjectCombination, Specialty> combinationSpecialtyJoin = combinationRoot.join("specialty");
            Join<Specialty, Faculty> specialtyFacultyJoin = combinationSpecialtyJoin.join("faculty");
            Join<SubjectCombination, Subject> subjectJoin = combinationRoot.join("subjects");

            subjectSubquery.select(specialtyFacultyJoin.get("university").get("id"))
                    .where(subjectJoin.get("id").in(subjectIds));

            predicates.add(universityRoot.get("id").in(subjectSubquery));
        }

        // Фильтр по баллу
        if (minScore != null || maxScore != null) {
            Path<Double> scorePath = universityRoot.get("avgEgeScore");

            if (minScore != null && maxScore != null) {
                predicates.add(cb.between(scorePath, minScore, maxScore));
            } else if (minScore != null) {
                predicates.add(cb.ge(scorePath, minScore));
            } else {
                predicates.add(cb.le(scorePath, maxScore));
            }
        }

        // Сортировка по рейтингу
        cq.orderBy(cb.asc(universityRoot.get("countryRanking")));

        // Убираем дубликаты
        cq.distinct(true);

        // Собираем все условия
        if (!predicates.isEmpty()) {
            cq.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        // Выполняем запрос
        TypedQuery<University> query = entityManager.createQuery(cq);
        return query.getResultList().stream()
                .map(universityMapper::fromUniversity)
                .collect(Collectors.toList());
    }

    public Long getUniversitiesCount() {
        return universityRepository.getUniversitiesCount();
    }

    public List<Object[]> getUniversitiesByRegion() {
        return universityRepository.getUniversitiesByRegion();
    }

    @Transactional
    public List<UniversityResponse> importUniversities(MultipartFile file, String mode) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is missing or empty");
        }

        if (!"ADD".equalsIgnoreCase(mode) && !"REPLACE".equalsIgnoreCase(mode)) {
            throw new IllegalArgumentException("Invalid import mode: " + mode + ". Use ADD or REPLACE.");
        }

        List<University> savedUniversities = new ArrayList<>();

        try (Reader reader = new InputStreamReader(new BOMInputStream(file.getInputStream()), StandardCharsets.UTF_8)) {
            CsvToBean<UniversityCsvDTO> csvToBean = new CsvToBeanBuilder<UniversityCsvDTO>(reader)
                    .withType(UniversityCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (UniversityCsvDTO dto : csvToBean) {
                String shortName = dto.getShortName() != null ? dto.getShortName().trim() : null;
                String fullName = dto.getFullName() != null ? dto.getFullName().trim() : null;
                String type = dto.getType() != null ? dto.getType().trim() : null;
                String cityName = dto.getCityName() != null ? dto.getCityName().trim() : null;

                if (shortName == null || shortName.isEmpty() ||
                        fullName == null || fullName.isEmpty() ||
                        type == null || type.isEmpty() ||
                        cityName == null || cityName.isEmpty()) {
                    throw new IllegalArgumentException("University names, type, or city_name is missing in CSV");
                }

                City city = cityRepository.findByNameIgnoreCase(cityName)
                        .orElseThrow(() -> new IllegalArgumentException("City not found: " + cityName));

                // Используем новый метод репозитория
                Optional<University> existing = universityRepository.findByShortNameIgnoreCaseAndCityId(shortName, city.getId());

                if ("ADD".equalsIgnoreCase(mode)) {
                    if (existing.isEmpty()) {
                        University newUniversity = new University();
                        newUniversity.setShortName(shortName);
                        newUniversity.setFullName(fullName);
                        newUniversity.setType(type);
                        newUniversity.setAvgEgeScore(dto.getAvgEgeScore());
                        newUniversity.setCountryRanking(dto.getCountryRanking());
                        newUniversity.setCity(city);
                        savedUniversities.add(universityRepository.save(newUniversity));
                    }
                } else {
                    University university = existing.orElseGet(University::new);
                    university.setShortName(shortName);
                    university.setFullName(fullName);
                    university.setType(type);
                    university.setAvgEgeScore(dto.getAvgEgeScore());
                    university.setCountryRanking(dto.getCountryRanking());
                    university.setCity(city);
                    savedUniversities.add(universityRepository.save(university));
                }
            }
        } catch (Exception e) {
            log.error("Failed to process universities CSV: {}", e.getMessage(), e);
            throw new Exception("Failed to process universities CSV: " + e.getMessage(), e);
        }

        return universityMapper.fromUniversityList(savedUniversities);
    }
}