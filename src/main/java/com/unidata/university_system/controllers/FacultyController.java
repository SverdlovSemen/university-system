package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.*;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.services.FacultyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/faculties")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private ProgramRepository programRepository;


    @GetMapping("/university/{universityId}")
    public List<FacultyResponse> getFacultiesByUniversityId(@PathVariable Long universityId) {
        return facultyService.getFacultiesByUniversity(universityId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public FacultyResponse createFaculty(@Valid @RequestBody FacultyRequest request) {
        return facultyService.createFaculty(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<FacultyResponse> updateFaculty(@PathVariable Long id, @Valid @RequestBody FacultyRequest request) {
        return facultyService.updateFaculty(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        if (facultyService.deleteFaculty(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<Faculty>> importFaculties(@RequestParam("file") MultipartFile file) {
        try {
            List<Faculty> faculties = facultyService.importFaculties(file);
            return ResponseEntity.ok(faculties);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacultyResponse> getFacultyById(@PathVariable Long id) {
        return facultyService.getFacultyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{facultyId}/programs/short")
    public ResponseEntity<List<ProgramListItemResponse>> getShortProgramsForFaculty(@PathVariable Long facultyId) {
        List<Program> programs = programRepository.findByFacultyId(facultyId);
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
}