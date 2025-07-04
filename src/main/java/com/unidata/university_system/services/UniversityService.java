package com.unidata.university_system.services;

import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UniversityService {

    @Autowired
    private UniversityRepository universityRepository;

    public List<University> getAllUniversities() {
        return universityRepository.findAll();
    }

    public Optional<University> getUniversityById(Long id) {
        return universityRepository.findById(id);
    }

    public University createUniversity(University university) {
        return universityRepository.save(university);
    }

    public Optional<University> updateUniversity(Long id, University updatedUniversity) {
        Optional<University> existingUniversity = universityRepository.findById(id);
        if (existingUniversity.isPresent()) {
            updatedUniversity.setId(id);
            return Optional.of(universityRepository.save(updatedUniversity));
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

    public List<University> searchUniversities(String name, String region, String type) {
        return universityRepository.search(name, region, type);
    }

    public Long getUniversitiesCount() {
        return universityRepository.getUniversitiesCount();
    }

    public List<Object[]> getUniversitiesByRegion() {
        return universityRepository.getUniversitiesByRegion();
    }
}