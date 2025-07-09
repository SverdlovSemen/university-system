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
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
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
                String name = dto.getName() != null ? dto.getName().trim() : null;
                String type = dto.getType() != null ? dto.getType().trim() : null;
                String cityName = dto.getCityName() != null ? dto.getCityName().trim() : null;

                if (name == null || name.isEmpty() || type == null || type.isEmpty() || cityName == null || cityName.isEmpty()) {
                    throw new IllegalArgumentException("University name, type, or city_name is missing in CSV");
                }

                City city = cityRepository.findByNameIgnoreCase(cityName)
                        .orElseThrow(() -> new IllegalArgumentException("City not found: " + cityName));

                Optional<University> existing = universityRepository.findByNameIgnoreCaseAndCityId(name, city.getId());

                if ("ADD".equalsIgnoreCase(mode)) {
                    if (existing.isEmpty()) {
                        University newUniversity = new University();
                        newUniversity.setName(name);
                        newUniversity.setType(type);
                        newUniversity.setAvgEgeScore(dto.getAvgEgeScore());
                        newUniversity.setCountryRanking(dto.getCountryRanking());
                        newUniversity.setCity(city);
                        savedUniversities.add(universityRepository.save(newUniversity));
                    }
                } else {
                    University university = existing.orElseGet(University::new);
                    university.setName(name);
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