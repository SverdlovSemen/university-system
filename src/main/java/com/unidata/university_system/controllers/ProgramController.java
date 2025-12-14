package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AdmissionConditionResponse;
import com.unidata.university_system.dto.ProgramResponse;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.repositories.ProgramRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/universities")
public class ProgramController {

    private final ProgramRepository programRepository;

    @Autowired
    public ProgramController(ProgramRepository programRepository) {
        this.programRepository = programRepository;
    }

    @GetMapping("/{universityId}/programs/{specialtyId}")
    public ResponseEntity<List<ProgramResponse>> getProgramsForSpecialtyInUniversity(
            @PathVariable Long universityId,
            @PathVariable Long specialtyId
    ) {
        List<Program> programs = programRepository.findBySpecializationId(specialtyId).stream()
                .filter(p -> p.getFaculty() != null && p.getFaculty().getUniversity() != null && p.getFaculty().getUniversity().getId().equals(universityId))
                .collect(Collectors.toList());

        List<ProgramResponse> response = programs.stream().map(p -> {
            var admission = p.getAdmissionConditions().stream().map(ac -> {
                List<SubjectResponse> subjects = ac.getProgramSubjects().stream()
                        .map(ps -> new SubjectResponse(ps.getSubject().getId(), ps.getSubject().getName()))
                        .collect(Collectors.toList());
                return new AdmissionConditionResponse(
                        ac.getYear(),
                        ac.getPassingScore(),
                        ac.getBudgetPlaces(),
                        ac.getTargetedPlaces(),
                        ac.getPaidPlaces(),
                        subjects
                );
            }).collect(Collectors.toList());

            List<SubjectResponse> progSubjects = p.getAdmissionConditions().stream()
                    .flatMap(ac -> ac.getProgramSubjects().stream())
                    .map(ps -> new SubjectResponse(ps.getSubject().getId(), ps.getSubject().getName()))
                    .distinct()
                    .collect(Collectors.toList());

            return new ProgramResponse(
                    p.getId(),
                    p.getFaculty().getId(),
                    p.getFaculty().getFullName(),
                    p.getFaculty().getUniversity().getId(),
                    p.getFaculty().getUniversity().getAbbreviation(),
                    p.getProgramDescription(),
                    p.getStudyForm() != null ? p.getStudyForm().getName() : null,
                    p.getDuration(),
                    admission,
                    progSubjects
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
