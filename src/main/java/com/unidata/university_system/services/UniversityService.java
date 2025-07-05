package com.unidata.university_system.services;

import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
import com.unidata.university_system.mapper.UniversityMapper;
import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UniversityService {

    @Autowired
    private UniversityRepository universityRepository;

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
}