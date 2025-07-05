package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.services.SpecialtyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
public class SpecialtyController {

    @Autowired
    private SpecialtyService specialtyService;

    @GetMapping
    public List<SpecialtyResponse> getAllSpecialties() {
        return specialtyService.getAllSpecialties();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpecialtyResponse> getSpecialtyById(@PathVariable Long id) {
        return specialtyService.getSpecialtyById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public SpecialtyResponse createSpecialty(@RequestBody SpecialtyRequest request) {
        return specialtyService.createSpecialty(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpecialtyResponse> updateSpecialty(@PathVariable Long id, @RequestBody SpecialtyRequest request) {
        return specialtyService.updateSpecialty(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        if (specialtyService.deleteSpecialty(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/by-faculty/{facultyId}")
    public List<SpecialtyResponse> getSpecialtiesByFaculty(@PathVariable Long facultyId) {
        return specialtyService.getSpecialtiesByFaculty(facultyId);
    }

    @GetMapping("/by-university/{universityId}")
    public List<SpecialtyResponse> getSpecialtiesByUniversity(@PathVariable Long universityId) {
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
}