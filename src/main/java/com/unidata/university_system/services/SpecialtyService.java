package com.unidata.university_system.services;

import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.repositories.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SpecialtyService {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    public Optional<Specialty> getSpecialtyById(Long id) {
        return specialtyRepository.findById(id);
    }

    public Specialty createSpecialty(Specialty specialty) {
        return specialtyRepository.save(specialty);
    }

    public Optional<Specialty> updateSpecialty(Long id, Specialty updatedSpecialty) {
        Optional<Specialty> existingSpecialty = specialtyRepository.findById(id);
        if (existingSpecialty.isPresent()) {
            updatedSpecialty.setId(id);
            return Optional.of(specialtyRepository.save(updatedSpecialty));
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

    public List<Specialty> getSpecialtiesByFaculty(Long facultyId) {
        return specialtyRepository.findByFacultyId(facultyId);
    }

    public List<Specialty> getSpecialtiesByUniversity(Long universityId) {
        return specialtyRepository.findByUniversityId(universityId);
    }

    public List<Specialty> searchSpecialties(Long universityId, String level, String form, String subject) {
        return specialtyRepository.searchSpecialties(universityId, level, form, subject);
    }
}