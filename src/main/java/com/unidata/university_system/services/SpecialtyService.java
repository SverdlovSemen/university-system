package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.dto.csv.SpecialtyCsvDTO;
import com.unidata.university_system.mapper.SpecialtyMapper;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.Subject;
import com.unidata.university_system.repositories.FacultyRepository;
import com.unidata.university_system.repositories.SpecialtyRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
    private final FacultyRepository facultyRepository;
    private final SpecialtyMapper specialtyMapper;

    @Autowired
    public SpecialtyService(
            SpecialtyRepository specialtyRepository,
            FacultyRepository facultyRepository,
            SpecialtyMapper specialtyMapper
    ) {
        this.specialtyRepository = specialtyRepository;
        this.facultyRepository = facultyRepository;
        this.specialtyMapper = specialtyMapper;
    }

    public List<SpecialtyResponse> findSpecialtiesBySubjects(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Specialty> allSpecialties = specialtyRepository.findAll();
        return allSpecialties.stream()
                .filter(specialty -> hasMatchingCombination(specialty, subjectIds))
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    private boolean hasMatchingCombination(Specialty specialty, List<Long> subjectIds) {
        if (specialty.getSubjectCombinations() == null) {
            return false;
        }

        return specialty.getSubjectCombinations().stream()
                .anyMatch(combination ->
                        combination.getSubjects() != null &&
                                combination.getSubjects().stream()
                                        .map(Subject::getId)
                                        .allMatch(subjectIds::contains)
                );
    }

    public List<SpecialtyResponse> getAllSpecialties() {
        return specialtyRepository.findAll().stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    public Optional<SpecialtyResponse> getSpecialtyById(Long id) {
        return specialtyRepository.findById(id)
                .map(specialtyMapper::fromSpecialty);
    }

    @Transactional(readOnly = true)
    public SpecialtyResponse getSpecialtyByIdWithDetails(Long id) {
        return specialtyRepository.findById(id)
                .map(specialty -> {
                    Hibernate.initialize(specialty.getSubjectCombinations());
                    if (specialty.getSubjectCombinations() != null) {
                        specialty.getSubjectCombinations().forEach(comb -> {
                            Hibernate.initialize(comb.getSubjects());
                        });
                    }
                    Hibernate.initialize(specialty.getFaculties());
                    return specialtyMapper.fromSpecialty(specialty);
                })
                .orElseThrow(() -> new EntityNotFoundException("Specialty not found"));
    }

    @Transactional
    public SpecialtyResponse createSpecialty(SpecialtyRequest request) {
        Specialty specialty = specialtyMapper.toSpecialty(request);
        Specialty savedSpecialty = specialtyRepository.save(specialty);
        return specialtyMapper.fromSpecialty(savedSpecialty);
    }

    @Transactional
    public Optional<SpecialtyResponse> updateSpecialty(Long id, SpecialtyRequest request) {
        return specialtyRepository.findById(id)
                .map(existingSpecialty -> {
                    // Обновляем основные поля
                    existingSpecialty.setName(request.name());
                    existingSpecialty.setProgramCode(request.programCode());
                    existingSpecialty.setDescription(request.description());

                    // Обновляем связи с факультетами
                    Set<Faculty> faculties = request.facultyIds().stream()
                            .map(facultyId -> {
                                Faculty faculty = new Faculty();
                                faculty.setId(facultyId);
                                return faculty;
                            })
                            .collect(Collectors.toSet());
                    existingSpecialty.setFaculties(faculties);

                    Specialty savedSpecialty = specialtyRepository.save(existingSpecialty);
                    return specialtyMapper.fromSpecialty(savedSpecialty);
                });
    }

    @Transactional
    public boolean deleteSpecialty(Long id) {
        if (specialtyRepository.existsById(id)) {
            specialtyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> getSpecialtiesByFaculty(Long facultyId) {
        return specialtyRepository.findByFacultiesId(facultyId).stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> getSpecialtiesByUniversity(Long universityId) {
        return specialtyRepository.findByFacultiesUniversityId(universityId).stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> searchSpecialties(
            Long universityId,
            String query,
            String level,
            String form,
            String subject
    ) {
        // Используем обновлённый метод репозитория
        List<Specialty> specialties = specialtyRepository.searchSpecialties(
                universityId,
                query,
                level,
                form,
                subject
        );

        return specialties.stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Specialty> importSpecialties(MultipartFile file) throws Exception {
        List<Specialty> savedSpecialties = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<SpecialtyCsvDTO> csvToBean = new CsvToBeanBuilder<SpecialtyCsvDTO>(reader)
                    .withType(SpecialtyCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (SpecialtyCsvDTO dto : csvToBean) {
                Specialty specialty;
                if (dto.getId() == null) {
                    specialty = new Specialty();
                } else {
                    specialty = specialtyRepository.findById(dto.getId())
                            .orElse(new Specialty());
                }

                specialty.setName(dto.getName());
                specialty.setProgramCode(dto.getProgramCode());
                specialty.setDescription(dto.getDescription());

                // Обработка нескольких факультетов
                if (dto.getFacultyIds() != null && !dto.getFacultyIds().isEmpty()) {
                    Set<Faculty> faculties = dto.getFacultyIds().stream()
                            .map(id -> {
                                Faculty faculty = new Faculty();
                                faculty.setId(id);
                                return faculty;
                            })
                            .collect(Collectors.toSet());
                    specialty.setFaculties(faculties);
                } else {
                    specialty.setFaculties(Collections.emptySet());
                }

                savedSpecialties.add(specialtyRepository.save(specialty));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process specialties CSV: " + e.getMessage(), e);
        }
        return savedSpecialties;
    }
}