package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AdmissionConditionResponse;
import com.unidata.university_system.dto.DisciplineRequest;
import com.unidata.university_system.dto.DisciplineResponse;
import com.unidata.university_system.dto.FacultyShortResponse;
import com.unidata.university_system.dto.ProgramListItemResponse;
import com.unidata.university_system.dto.ProgramRequest;
import com.unidata.university_system.dto.ProgramResponse;
import com.unidata.university_system.dto.SpecialtyShortResponse;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.services.ProgramService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
public class ProgramController {

    private final ProgramRepository programRepository;
    private final ProgramService programService;

    @Autowired
    public ProgramController(ProgramRepository programRepository, ProgramService programService) {
        this.programRepository = programRepository;
        this.programService = programService;
    }

    @GetMapping("/api/programs/{id}")
    public ResponseEntity<ProgramResponse> getProgramById(@PathVariable Long id) {
        Optional<Program> programOpt = programRepository.findById(id);
        if (programOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOpt.get();
        ProgramResponse response = mapProgram(program);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/universities/{universityId}/programs/{specialtyId}")
    public ResponseEntity<List<ProgramResponse>> getProgramsForSpecialtyInUniversity(
            @PathVariable Long universityId,
            @PathVariable Long specialtyId
    ) {
        List<Program> programs = programRepository.findBySpecializationId(specialtyId).stream()
                .filter(p -> p.getFaculty() != null && p.getFaculty().getUniversity() != null && p.getFaculty().getUniversity().getId().equals(universityId))
                .toList();

        List<ProgramResponse> response = programs.stream().map(this::mapProgram).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/universities/{universityId}/programs")
    public ResponseEntity<List<ProgramResponse>> getProgramsForUniversity(
            @PathVariable Long universityId
    ) {
        List<Program> programs = programRepository.findByFacultyUniversityId(universityId);
        List<ProgramResponse> response = programs.stream().map(this::mapProgram).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/universities/{universityId}/programs/short")
    public ResponseEntity<List<ProgramListItemResponse>> getShortProgramsForUniversity(
            @PathVariable Long universityId
    ) {
        List<Program> programs = programRepository.findByFacultyUniversityId(universityId);
        List<ProgramListItemResponse> response = programs.stream().map(p ->
                new ProgramListItemResponse(
                        p.getId(),
                        new FacultyShortResponse(
                                p.getFaculty().getId(),
                                p.getFaculty().getFullName(),
                                p.getFaculty().getAbbreviation()
                        ),
                        new SpecialtyShortResponse(
                                p.getSpecialization().getId(),
                                p.getSpecialization().getName(),
                                p.getSpecialization().getProgramCode(),
                                p.getSpecialization().getEducationLevel() != null ? p.getSpecialization().getEducationLevel().getName() : null
                        )
                )
        ).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/universities/{universityId}/programs/{programId}/disciplines")
    public ResponseEntity<List<DisciplineResponse>> getProgramDisciplines(
            @PathVariable Long universityId,
            @PathVariable Long programId
    ) {
        Optional<Program> programOpt = programRepository.findById(programId);
        if (programOpt.isEmpty() || programOpt.get().getFaculty() == null ||
                programOpt.get().getFaculty().getUniversity() == null ||
                !programOpt.get().getFaculty().getUniversity().getId().equals(universityId)) {
            return ResponseEntity.notFound().build();
        }
        List<DisciplineResponse> disciplines = programService.getDisciplinesForProgram(programId);
        return ResponseEntity.ok(disciplines);
    }

    @PostMapping("/api/programs/{programId}/disciplines")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<?> createDiscipline(
            @PathVariable Long programId,
            @Valid @RequestBody DisciplineRequest request
    ) {
        try {
            com.unidata.university_system.models.Discipline discipline = programService.createDiscipline(programId, request);
            DisciplineResponse response = new DisciplineResponse(
                    discipline.getId(),
                    discipline.getName(),
                    discipline.getSemester(),
                    discipline.getTotalHours()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка при создании дисциплины");
        }
    }

    @PostMapping("/api/programs")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<ProgramResponse> createProgram(@Valid @RequestBody ProgramRequest request) {
        try {
            Program program = programService.createProgram(request);
            ProgramResponse response = mapProgram(program);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/api/programs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<ProgramResponse> updateProgram(@PathVariable Long id, @Valid @RequestBody ProgramRequest request) {
        try {
            Program program = programService.updateProgram(id, request);
            ProgramResponse response = mapProgram(program);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/api/programs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deleteProgram(@PathVariable Long id) {
        try {
            programService.deleteProgram(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ProgramResponse mapProgram(Program p) {
        var admission = p.getAdmissionConditions().stream().map(ac -> {
            List<SubjectResponse> subjects = ac.getProgramSubjects().stream()
                    .map(ps -> new SubjectResponse(
                            ps.getSubject().getId(),
                            ps.getSubject().getName(),
                            ps.getExamNumber(),
                            ps.getMinScore()
                    ))
                    .sorted(Comparator.comparing(subject -> subject.examNumber() == null ? Integer.MAX_VALUE : subject.examNumber()))
                    .toList();
            return new AdmissionConditionResponse(
                    ac.getId(),
                    ac.getYear(),
                    ac.getPassingScore(),
                    ac.getBudgetPlaces(),
                    ac.getTargetedPlaces(),
                    ac.getPaidPlaces(),
                    subjects,
                    ac.getAdmissionFee(),
                    ac.getHasDvi()
            );
        }).toList();

        List<SubjectResponse> progSubjects = p.getAdmissionConditions().stream()
                .flatMap(ac -> ac.getProgramSubjects().stream())
                .map(ps -> new SubjectResponse(
                        ps.getSubject().getId(),
                        ps.getSubject().getName(),
                        ps.getExamNumber(),
                        ps.getMinScore()
                ))
                .distinct()
                .toList();

        return new ProgramResponse(
                p.getId(),
                new FacultyShortResponse(
                        p.getFaculty().getId(),
                        p.getFaculty().getFullName(),
                        p.getFaculty().getAbbreviation()
                ),
                new SpecialtyShortResponse(
                        p.getSpecialization().getId(),
                        p.getSpecialization().getName(),
                        p.getSpecialization().getProgramCode(),
                        p.getSpecialization().getEducationLevel() != null ? p.getSpecialization().getEducationLevel().getName() : null
                ),
                p.getProgramDescription(),
                p.getStudyForm() != null ? p.getStudyForm().getName() : null,
                p.getStudyForm() != null ? p.getStudyForm().getId() : null,
                p.getDuration(),
                Boolean.TRUE.equals(p.getMobilityOption()),
                p.getTeachingLanguage(),
                admission,
                progSubjects,
                p.getDisciplines().stream()
                        .map(d -> new DisciplineResponse(
                                d.getId(),
                                d.getName(),
                                d.getSemester(),
                                d.getTotalHours()
                        ))
                        .toList()
        );
    }
}
