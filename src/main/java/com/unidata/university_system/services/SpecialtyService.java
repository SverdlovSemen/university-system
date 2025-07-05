package com.unidata.university_system.services;

import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.mapper.SpecialtyMapper;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.repositories.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SpecialtyService {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private SpecialtyMapper specialtyMapper;

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
            updatedSpecialty.setId(id); // Ensure ID is preserved
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

    public List<SpecialtyResponse> searchSpecialties(Long universityId, String level, String form, String subject) {
        return specialtyRepository.searchSpecialties(universityId, level, form, subject).stream()
                .map(specialtyMapper::fromSpecialty)
                .collect(Collectors.toList());
    }
}