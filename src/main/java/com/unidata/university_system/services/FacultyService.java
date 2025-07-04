package com.unidata.university_system.services;

import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.repositories.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    public List<Faculty> getAllFaculties() {
        return facultyRepository.findAll();
    }

    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }

    public Faculty createFaculty(Faculty faculty) {
        return facultyRepository.save(faculty);
    }

    public Optional<Faculty> updateFaculty(Long id, Faculty updatedFaculty) {
        Optional<Faculty> existingFaculty = facultyRepository.findById(id);
        if (existingFaculty.isPresent()) {
            updatedFaculty.setId(id);
            return Optional.of(facultyRepository.save(updatedFaculty));
        }
        return Optional.empty();
    }

    public boolean deleteFaculty(Long id) {
        if (facultyRepository.existsById(id)) {
            facultyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<Faculty> getFacultiesByUniversity(Long universityId) {
        return facultyRepository.findByUniversityId(universityId);
    }
}