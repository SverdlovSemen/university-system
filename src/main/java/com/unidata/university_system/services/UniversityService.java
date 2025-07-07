package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
import com.unidata.university_system.dto.csv.UniversityCsvDTO;
import com.unidata.university_system.mapper.UniversityMapper;
import com.unidata.university_system.models.City;
import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.CityRepository;
import com.unidata.university_system.repositories.UniversityRepository;
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
public class UniversityService {

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private UniversityMapper universityMapper;

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
        University savedUniversity = universityRepository.save(university);
        return universityMapper.fromUniversity(savedUniversity);
    }

    public Optional<UniversityResponse> updateUniversity(Long id, UniversityRequest request) {
        Optional<University> existingUniversity = universityRepository.findById(id);
        if (existingUniversity.isPresent()) {
            University updatedUniversity = universityMapper.toUniversity(request);
            updatedUniversity.setId(id); // Ensure ID is preserved
            University savedUniversity = universityRepository.save(updatedUniversity);
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

    public List<UniversityResponse> searchUniversities(String name, String region, String type) {
        return universityRepository.search(name, region, type).stream()
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
    public List<University> importUniversities(MultipartFile file) throws Exception {
        List<University> savedUniversities = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<UniversityCsvDTO> csvToBean = new CsvToBeanBuilder<UniversityCsvDTO>(reader)
                    .withType(UniversityCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (UniversityCsvDTO dto : csvToBean) {
                City city = cityRepository.findById(dto.getCityId())
                        .orElseThrow(() -> new IllegalArgumentException("City with ID " + dto.getCityId() + " not found"));

                University university;
                if (dto.getId() == null) {
                    university = new University();
                } else {
                    university = universityRepository.findById(dto.getId())
                            .orElseThrow(() -> new IllegalArgumentException("University with ID " + dto.getId() + " not found"));
                }
                university.setName(dto.getName());
                university.setType(dto.getType());
                university.setAvgEgeScore(dto.getAvgEgeScore());
                university.setCountryRanking(dto.getCountryRanking());
                university.setCity(city);
                savedUniversities.add(universityRepository.save(university));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process universities CSV: " + e.getMessage(), e);
        }
        return savedUniversities;
    }
}