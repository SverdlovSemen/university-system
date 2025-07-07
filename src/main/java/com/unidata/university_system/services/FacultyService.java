package com.unidata.university_system.services;

import com.unidata.university_system.dto.FacultyRequest;
import com.unidata.university_system.dto.FacultyResponse;
import com.unidata.university_system.mapper.FacultyMapper;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.repositories.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private FacultyMapper facultyMapper;

    public List<FacultyResponse> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(facultyMapper::fromFaculty)
                .collect(Collectors.toList());
    }

    public Optional<FacultyResponse> getFacultyById(Long id) {
        return facultyRepository.findById(id)
                .map(facultyMapper::fromFaculty);
    }

    public FacultyResponse createFaculty(FacultyRequest request) {
        Faculty faculty = facultyMapper.toFaculty(request);
        Faculty savedFaculty = facultyRepository.save(faculty);
        return facultyMapper.fromFaculty(savedFaculty);
    }

    public Optional<FacultyResponse> updateFaculty(Long id, FacultyRequest request) {
        Optional<Faculty> existingFaculty = facultyRepository.findById(id);
        if (existingFaculty.isPresent()) {
            Faculty updatedFaculty = facultyMapper.toFaculty(request);
            updatedFaculty.setId(id);
            Faculty savedFaculty = facultyRepository.save(updatedFaculty);
            return Optional.of(facultyMapper.fromFaculty(savedFaculty));
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

    public List<FacultyResponse> getFacultiesByUniversity(Long universityId) {
        return facultyRepository.findByUniversityId(universityId).stream()
                .map(facultyMapper::fromFaculty)
                .collect(Collectors.toList());
    }
}