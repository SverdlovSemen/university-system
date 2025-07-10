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

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SpecialtyService {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private SpecialtyMapper specialtyMapper;


    public List<SpecialtyResponse> findSpecialtiesBySubjects(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Получаем все специальности
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

    public SpecialtyResponse createSpecialty(SpecialtyRequest request) {
        Specialty specialty = specialtyMapper.toSpecialty(request);
        Specialty savedSpecialty = specialtyRepository.save(specialty);
        return specialtyMapper.fromSpecialty(savedSpecialty);
    }

    public Optional<SpecialtyResponse> updateSpecialty(Long id, SpecialtyRequest request) {
        Optional<Specialty> existingSpecialty = specialtyRepository.findById(id);
        if (existingSpecialty.isPresent()) {
            Specialty updatedSpecialty = specialtyMapper.toSpecialty(request);
            updatedSpecialty.setId(id);
            Specialty savedSpecialty = specialtyRepository.save(updatedSpecialty);
            return Optional.of(specialtyMapper.fromSpecialty(savedSpecialty));
        }
        return Optional.empty();
    }

    public boolean deleteSpecialty(Long id) {
        if (specialtyRepository.existsById(id)) {
            specialtyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<SpecialtyResponse> getSpecialtiesByFaculty(Long facultyId) {
        return specialtyRepository.findByFacultyId(facultyId).stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    public List<SpecialtyResponse> getSpecialtiesByUniversity(Long universityId) {
        return specialtyRepository.findByUniversityId(universityId).stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }

    public List<SpecialtyResponse> searchSpecialties(
            Long universityId,
            String query, // Новый параметр
            String level,
            String form,
            String subject) {
        return specialtyRepository.searchSpecialties(
                        universityId,
                        query, // Передаем в репозиторий
                        level,
                        form,
                        subject
                ).stream()
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
                Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                        .orElseThrow(() -> new IllegalArgumentException("Faculty with ID " + dto.getFacultyId() + " not found"));

                Specialty specialty;
                if (dto.getId() == null) {
                    specialty = new Specialty();
                } else {
                    specialty = specialtyRepository.findById(dto.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Specialty with ID " + dto.getId() + " not found"));
                }
                specialty.setName(dto.getName());
                specialty.setProgramCode(dto.getProgramCode());
                specialty.setDescription(dto.getDescription());
                specialty.setFaculty(faculty);
                savedSpecialties.add(specialtyRepository.save(specialty));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process specialties CSV: " + e.getMessage(), e);
        }
        return savedSpecialties;
    }
}