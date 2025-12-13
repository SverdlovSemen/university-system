package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.FacultyRequest;
import com.unidata.university_system.dto.FacultyResponse;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyMapper {

    @Autowired
    private UniversityRepository universityRepository;

    public Faculty toFaculty(FacultyRequest request) {
        if (request == null) return null;
        Faculty faculty = new Faculty();
        faculty.setId(request.id());
        faculty.setFullName(request.fullName());
        faculty.setAbbreviation(request.abbreviation());
        faculty.setDeanName(request.deanName());
        faculty.setDeanContacts(request.deanContacts());
        faculty.setAddress(request.address());
        faculty.setEmail(request.email());
        faculty.setPhone(request.phone());
        if (request.universityId() != null) {
            University university = universityRepository.findById(request.universityId())
                    .orElseThrow(() -> new IllegalArgumentException("University not found with ID: " + request.universityId()));
            faculty.setUniversity(university);
        }
        return faculty;
    }

    public FacultyResponse fromFaculty(Faculty faculty) {
        if (faculty == null) return null;
        return new FacultyResponse(
                faculty.getId(),
                faculty.getFullName(),
                faculty.getAbbreviation(),
                faculty.getUniversity() != null ? faculty.getUniversity().getId() : null,
                faculty.getDeanName(),
                faculty.getDeanContacts(),
                faculty.getAddress(),
                faculty.getEmail(),
                faculty.getPhone()
        );
    }

    public List<FacultyResponse> fromFacultyList(List<Faculty> faculties) {
        if (faculties == null) return Collections.emptyList();
        return faculties.stream()
                .map(this::fromFaculty)
                .collect(Collectors.toList());
    }
}