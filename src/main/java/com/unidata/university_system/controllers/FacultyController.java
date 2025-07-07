package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.FacultyRequest;
import com.unidata.university_system.dto.FacultyResponse;
import com.unidata.university_system.services.FacultyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculties")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @GetMapping("/university/{universityId}")
    public List<FacultyResponse> getFacultiesByUniversityId(@PathVariable Long universityId) {
        return facultyService.getFacultiesByUniversity(universityId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public FacultyResponse createFaculty(@Valid @RequestBody FacultyRequest request) {
        return facultyService.createFaculty(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FacultyResponse> updateFaculty(@PathVariable Long id, @Valid @RequestBody FacultyRequest request) {
        return facultyService.updateFaculty(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        if (facultyService.deleteFaculty(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}