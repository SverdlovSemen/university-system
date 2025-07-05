package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.FacultyRequest;
import com.unidata.university_system.dto.FacultyResponse;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyMapper {

    @Autowired
    private SpecialtyMapper specialtyMapper;

    @Autowired
    private UniversityRepository universityRepository; // Use repository instead of service

    public Faculty toFaculty(FacultyRequest request) {
        if (request == null) return null;
        Faculty faculty = new Faculty();
        faculty.setId(request.id());
        faculty.setName(request.name());
        faculty.setUniversity(universityRepository.findById(request.universityId())
                .orElseThrow(() -> new IllegalArgumentException("University not found with ID: " + request.universityId())));
        faculty.setSpecialties(request.specialties() != null ?
                request.specialties().stream()
                        .map(specialtyMapper::toSpecialty)
                        .collect(Collectors.toList()) : Collections.emptyList());
        return faculty;
    }

    public FacultyResponse fromFaculty(Faculty faculty) {
        if (faculty == null) return null;
        return new FacultyResponse(
                faculty.getId(),
                faculty.getName(),
                null, // Prevent recursion
                faculty.getSpecialties() != null ?
                        faculty.getSpecialties().stream()
                                .map(specialtyMapper::fromSpecialty)
                                .collect(Collectors.toList()) : null
        );
    }

    public List<FacultyResponse> fromFacultyList(List<Faculty> faculties) {
        if (faculties == null) return Collections.emptyList();
        return faculties.stream()
                .map(this::fromFaculty)
                .collect(Collectors.toList());
    }
}