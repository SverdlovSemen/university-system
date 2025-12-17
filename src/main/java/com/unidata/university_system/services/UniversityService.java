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
import org.apache.commons.io.ByteOrderMark;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.models.User;

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
    private UserRepository userRepository;

    @Autowired
    private UniversityEmployeeRepository universityEmployeeRepository;

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
        validateAccreditation(university.getAccreditationExpiryDate());

        University savedUniversity = universityRepository.save(university);
        return universityMapper.fromUniversity(savedUniversity);
    }

    public List<UniversityResponse> getUniversitiesBySpecialty(Long specialtyId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<University> cq = cb.createQuery(University.class);
        Root<University> universityRoot = cq.from(University.class);

        // Университет → Факультет → Программы → Специализации
        Join<University, Faculty> facultyJoin = universityRoot.join("faculties");
        Join<Faculty, Program> programJoin = facultyJoin.join("programs");
        Join<Program, Specialty> specialtyJoin = programJoin.join("specialization");

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

            // Authorization: only ADMIN or EDITOR (belonging to this university) can update
            checkCanModifyUniversity(id);

            // Обновляем поля
            university.setFullName(request.fullName());
            university.setAbbreviation(request.abbreviation());
            university.setType(request.type());
            university.setOwnershipType(request.ownershipType());
            university.setFoundedYear(request.foundedYear());
            university.setWebsite(request.website());
            university.setAdminEmail(request.adminEmail());
            university.setAdminPhone(request.adminPhone());
            university.setAccreditationNumber(request.accreditationNumber());
            university.setAccreditationExpiryDate(request.accreditationExpiryDate());
            validateAccreditation(university.getAccreditationExpiryDate());

            // Обновляем город, если изменился cityId
            if (request.cityId() != null) {
                if (university.getCity() == null || !request.cityId().equals(university.getCity().getId())) {
                    City city = cityRepository.findById(request.cityId())
                            .orElseThrow(() -> new IllegalArgumentException("City not found: " + request.cityId()));
                    university.setCity(city);
                }
            }

            University savedUniversity = universityRepository.save(university);
            return Optional.of(universityMapper.fromUniversity(savedUniversity));
        }
        return Optional.empty();
    }

    public boolean deleteUniversity(Long id) {
        if (universityRepository.existsById(id)) {
            // Authorization: ensure current user can delete
            checkCanModifyUniversity(id);
            universityRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private void checkCanModifyUniversity(Long universityId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new AccessDeniedException("Unauthorized");
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AccessDeniedException("User not found"));
        if (user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getName())) return;
        if (user.getRole() != null && ("ROLE_EDITOR".equals(user.getRole().getName()) || "ROLE_UNIVERSITY_ADMIN".equals(user.getRole().getName()))) {
            boolean ok = universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, user.getId());
            if (!ok) throw new AccessDeniedException("Not allowed to modify this university");
            return;
        }
        throw new AccessDeniedException("Not allowed");
    }

    public List<UniversityResponse> searchUniversitiesByName(String nameQuery, int limit) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<University> cq = cb.createQuery(University.class);
        Root<University> root = cq.from(University.class);

        List<Predicate> predicates = new ArrayList<>();

        if (nameQuery != null && !nameQuery.isEmpty()) {
            String pattern = "%" + nameQuery.toLowerCase() + "%";
            Predicate abbreviationPredicate = cb.like(cb.lower(root.get("abbreviation")), pattern);
            Predicate fullNamePredicate = cb.like(cb.lower(root.get("fullName")), pattern);
            predicates.add(cb.or(abbreviationPredicate, fullNamePredicate));
        }

        cq.where(predicates.toArray(new Predicate[0]));
        // Сортируем по ID (можно добавить сортировку по рейтингу из university_ratings если нужно)

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
            Predicate abbreviationPredicate = cb.like(cb.lower(universityRoot.get("abbreviation")), pattern);
            Predicate fullNamePredicate = cb.like(cb.lower(universityRoot.get("fullName")), pattern);
            predicates.add(cb.or(abbreviationPredicate, fullNamePredicate));
        }

        // Фильтр по региону
        if (regionId != null) {
            Join<University, City> cityJoin = universityRoot.join("city");
            Join<City, Region> regionJoin = cityJoin.join("region");
            predicates.add(cb.equal(regionJoin.get("id"), regionId));
        }

        // Фильтр по специальностям
        if (specialtyIds != null && !specialtyIds.isEmpty()) {
            Subquery<Long> universitySubquery = cq.subquery(Long.class);
            Root<Program> programRoot = universitySubquery.from(Program.class);
            Join<Program, Faculty> programFacultyJoin = programRoot.join("faculty");

            universitySubquery.select(programFacultyJoin.get("university").get("id"))
                    .where(programRoot.get("specialization").get("id").in(specialtyIds));

            predicates.add(universityRoot.get("id").in(universitySubquery));
        }

        // Фильтр по предметам
        if (subjectIds != null && !subjectIds.isEmpty()) {
            Subquery<Long> subjectSubquery = cq.subquery(Long.class);
            Root<ProgramSubject> programSubjectRoot = subjectSubquery.from(ProgramSubject.class);
            Join<ProgramSubject, AdmissionCondition> admissionConditionJoin = programSubjectRoot.join("admissionCondition");
            Join<AdmissionCondition, Program> programJoin = admissionConditionJoin.join("program");
            Join<Program, Faculty> facultyJoin = programJoin.join("faculty");

            subjectSubquery.select(facultyJoin.get("university").get("id"))
                    .where(programSubjectRoot.get("subject").get("id").in(subjectIds));

            predicates.add(universityRoot.get("id").in(subjectSubquery));
        }

        // Фильтр по проходному баллу (admission_conditions.passing_score)
        if (minScore != null || maxScore != null) {
            Subquery<Long> scoreSubquery = cq.subquery(Long.class);
            Root<AdmissionCondition> admissionRoot = scoreSubquery.from(AdmissionCondition.class);
            Join<AdmissionCondition, Program> programJoin = admissionRoot.join("program");
            Join<Program, Faculty> facultyJoin = programJoin.join("faculty");

            List<Predicate> scorePredicates = new ArrayList<>();
            if (minScore != null) {
                scorePredicates.add(cb.greaterThanOrEqualTo(
                        admissionRoot.get("passingScore"),
                        java.math.BigDecimal.valueOf(minScore)
                ));
            }
            if (maxScore != null) {
                scorePredicates.add(cb.lessThanOrEqualTo(
                        admissionRoot.get("passingScore"),
                        java.math.BigDecimal.valueOf(maxScore)
                ));
            }

            scoreSubquery.select(facultyJoin.get("university").get("id"))
                    .where(cb.and(scorePredicates.toArray(new Predicate[0])));

            predicates.add(universityRoot.get("id").in(scoreSubquery));
        }

        // Фильтр по баллу - убрано, так как avgEgeScore больше нет в модели University
        // Можно добавить фильтрацию через university_ratings или admission_conditions если нужно

        // Сортировка по ID (можно добавить сортировку по рейтингу из university_ratings если нужно)

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

        try (Reader reader = new InputStreamReader(
                new BOMInputStream(file.getInputStream(), false, ByteOrderMark.UTF_8, ByteOrderMark.UTF_16LE, ByteOrderMark.UTF_16BE),
                StandardCharsets.UTF_8)) {
            CsvToBean<UniversityCsvDTO> csvToBean = new CsvToBeanBuilder<UniversityCsvDTO>(reader)
                    .withType(UniversityCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (UniversityCsvDTO dto : csvToBean) {
                String abbreviation = dto.getShortName() != null ? dto.getShortName().trim() : null;
                String fullName = dto.getFullName() != null ? dto.getFullName().trim() : null;
                String type = dto.getType() != null ? dto.getType().trim() : null;
                String cityName = dto.getCityName() != null ? dto.getCityName().trim() : null;

                if (abbreviation == null || abbreviation.isEmpty() ||
                        fullName == null || fullName.isEmpty() ||
                        type == null || type.isEmpty() ||
                        cityName == null || cityName.isEmpty()) {
                    throw new IllegalArgumentException("University names, type, or city_name is missing in CSV");
                }

                City city = cityRepository.findByNameIgnoreCase(cityName)
                        .orElseThrow(() -> new IllegalArgumentException("City not found: " + cityName));

                // Используем новый метод репозитория (нужно обновить метод в репозитории)
                Optional<University> existing = universityRepository.findByAbbreviationIgnoreCaseAndCityId(abbreviation, city.getId());

                if ("ADD".equalsIgnoreCase(mode)) {
                    if (existing.isEmpty()) {
                        University newUniversity = new University();
                        newUniversity.setAbbreviation(abbreviation);
                        newUniversity.setFullName(fullName);
                        newUniversity.setType(type);
                        newUniversity.setCity(city);
                        newUniversity.setCreatedAt(java.time.LocalDateTime.now());
                        savedUniversities.add(universityRepository.save(newUniversity));
                    }
                } else {
                    University university = existing.orElseGet(University::new);
                    university.setAbbreviation(abbreviation);
                    university.setFullName(fullName);
                    university.setType(type);
                    university.setCity(city);
                    if (university.getCreatedAt() == null) {
                        university.setCreatedAt(java.time.LocalDateTime.now());
                    }
                    university.setUpdatedAt(java.time.LocalDateTime.now());
                    savedUniversities.add(universityRepository.save(university));
                }
            }
        } catch (Exception e) {
            log.error("Failed to process universities CSV: {}", e.getMessage(), e);
            throw new Exception("Failed to process universities CSV: " + e.getMessage(), e);
        }

        return universityMapper.fromUniversityList(savedUniversities);
    }

    private void validateAccreditation(java.time.LocalDate accreditationExpiryDate) {
        if (accreditationExpiryDate == null) {
            return;
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (accreditationExpiryDate.isBefore(today)) {
            throw new IllegalArgumentException("Дата окончания аккредитации не может быть в прошлом");
        }

        if (accreditationExpiryDate.isAfter(today.plusYears(6))) {
            throw new IllegalArgumentException("Срок аккредитации не может превышать 6 лет от текущей даты");
        }
    }
}