package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.services.SpecialtyService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
public class SpecialtyController {

    @Autowired
    private SpecialtyService specialtyService;

    @GetMapping("/faculty/{facultyId}")
    public List<SpecialtyResponse> getSpecialtiesByFacultyId(@PathVariable Long facultyId) {
        return specialtyService.getSpecialtiesByFaculty(facultyId);
    }

    @GetMapping("/university/{universityId}")
    public List<SpecialtyResponse> getSpecialtiesByUniversityId(@PathVariable Long universityId) {
        return specialtyService.getSpecialtiesByUniversity(universityId);
    }

    @GetMapping("/search")
    public List<SpecialtyResponse> searchSpecialties(
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String form,
            @RequestParam(required = false) String subject) {
        return specialtyService.searchSpecialties(universityId, level, form, subject);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SpecialtyResponse createSpecialty(@Valid @RequestBody SpecialtyRequest request) {
        return specialtyService.createSpecialty(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SpecialtyResponse> updateSpecialty(@PathVariable Long id, @Valid @RequestBody SpecialtyRequest request) {
        return specialtyService.updateSpecialty(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        if (specialtyService.deleteSpecialty(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<Specialty>> importSpecialties(@RequestParam("file") MultipartFile file) {
        try {
            List<Specialty> specialties = specialtyService.importSpecialties(file);
            return ResponseEntity.ok(specialties);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}