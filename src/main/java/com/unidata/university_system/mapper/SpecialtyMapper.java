package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.repositories.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialtyMapper {

    @Autowired
    private SubjectCombinationMapper subjectCombinationMapper;

    @Autowired
    private FacultyRepository facultyRepository;

    public Specialty toSpecialty(SpecialtyRequest request) {
        if (request == null) return null;
        Specialty specialty = new Specialty();
        specialty.setId(request.id());
        specialty.setName(request.name());
        specialty.setProgramCode(request.programCode());
        specialty.setDescription(request.description());
        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found with ID: " + request.facultyId()));
        specialty.setFaculty(faculty);
        specialty.setSubjectCombinations(request.subjectCombinations() != null ?
                request.subjectCombinations().stream()
                        .map(subjectCombinationMapper::toSubjectCombination)
                        .collect(Collectors.toList()) : Collections.emptyList());
        return specialty;
    }

    public SpecialtyResponse fromSpecialty(Specialty specialty) {
        if (specialty == null) return null;
        return new SpecialtyResponse(
                specialty.getId(),
                specialty.getName(),
                specialty.getProgramCode(),
                specialty.getDescription(),
                specialty.getFaculty().getId(),
                specialty.getSubjectCombinations() != null ?
                        specialty.getSubjectCombinations().stream()
                                .map(subjectCombinationMapper::fromSubjectCombination)
                                .collect(Collectors.toList()) : null
        );
    }

    public List<SpecialtyResponse> fromSpecialtyList(List<Specialty> specialties) {
        if (specialties == null) return Collections.emptyList();
        return specialties.stream()
                .map(this::fromSpecialty)
                .collect(Collectors.toList());
    }
}