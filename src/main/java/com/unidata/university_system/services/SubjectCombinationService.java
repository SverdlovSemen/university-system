package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.dto.csv.SubjectCombinationCsvDTO;
import com.unidata.university_system.mapper.SubjectCombinationMapper;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.SubjectCombination;
import com.unidata.university_system.repositories.SpecialtyRepository;
import com.unidata.university_system.repositories.SubjectCombinationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubjectCombinationService {

    @Autowired
    private SubjectCombinationRepository subjectCombinationRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private SubjectCombinationMapper subjectCombinationMapper;

    public List<SubjectCombinationResponse> getAllSubjectCombinations() {
        return subjectCombinationRepository.findAll().stream()
                .map(subjectCombinationMapper::fromSubjectCombination)
                .collect(Collectors.toList());
    }

    public Optional<SubjectCombinationResponse> getSubjectCombinationById(Long id) {
        return subjectCombinationRepository.findById(id) // Исправлено: subjectConnectionRepository -> subjectCombinationRepository
                .map(subjectCombinationMapper::fromSubjectCombination);
    }

    public SubjectCombinationResponse createSubjectCombination(SubjectCombinationRequest request) {
        SubjectCombination subjectCombination = subjectCombinationMapper.toSubjectCombination(request);
        SubjectCombination savedSubjectCombination = subjectCombinationRepository.save(subjectCombination);
        return subjectCombinationMapper.fromSubjectCombination(savedSubjectCombination);
    }

    public Optional<SubjectCombinationResponse> updateSubjectCombination(Long id, SubjectCombinationRequest request) {
        Optional<SubjectCombination> existingSubjectCombination = subjectCombinationRepository.findById(id);
        if (existingSubjectCombination.isPresent()) {
            SubjectCombination updatedSubjectCombination = subjectCombinationMapper.toSubjectCombination(request);
            updatedSubjectCombination.setId(id);
            SubjectCombination savedSubjectCombination = subjectCombinationRepository.save(updatedSubjectCombination);
            return Optional.of(subjectCombinationMapper.fromSubjectCombination(savedSubjectCombination));
        }
        return Optional.empty();
    }

    public boolean deleteSubjectCombination(Long id) {
        if (subjectCombinationRepository.existsById(id)) {
            subjectCombinationRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<SubjectCombinationResponse> getSubjectCombinationsBySpecialtyId(Long specialtyId) {
        return subjectCombinationRepository.findBySpecialtyId(specialtyId).stream()
                .map(subjectCombinationMapper::fromSubjectCombination)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<SubjectCombination> importSubjectCombinations(MultipartFile file) throws Exception {
        List<SubjectCombination> savedCombinations = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<SubjectCombinationCsvDTO> csvToBean = new CsvToBeanBuilder<SubjectCombinationCsvDTO>(reader)
                    .withType(SubjectCombinationCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (SubjectCombinationCsvDTO dto : csvToBean) {
                Specialty specialty = specialtyRepository.findById(dto.getSpecialtyId())
                        .orElseThrow(() -> new IllegalArgumentException("Specialty with ID " + dto.getSpecialtyId() + " not found"));

                SubjectCombination combination;
                if (dto.getId() == null) {
                    combination = new SubjectCombination();
                } else {
                    combination = subjectCombinationRepository.findById(dto.getId())
                            .orElseThrow(() -> new IllegalArgumentException("SubjectCombination with ID " + dto.getId() + " not found"));
                }
                combination.setSpecialty(specialty);
                savedCombinations.add(subjectCombinationRepository.save(combination));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process subject combinations CSV: " + e.getMessage(), e);
        }
        return savedCombinations;
    }
}