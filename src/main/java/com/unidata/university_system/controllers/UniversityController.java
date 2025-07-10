package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
import com.unidata.university_system.models.University;
import com.unidata.university_system.services.UniversityService;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
public class UniversityController {

    @Autowired
    private UniversityService universityService;

    @GetMapping
    public List<UniversityResponse> getAllUniversities() {
        return universityService.getAllUniversities();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UniversityResponse> getUniversityById(@PathVariable Long id) {
        return universityService.getUniversityById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public UniversityResponse createUniversity(@RequestBody UniversityRequest request) {
        return universityService.createUniversity(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UniversityResponse> updateUniversity(@PathVariable Long id, @RequestBody UniversityRequest request) {
        return universityService.updateUniversity(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUniversity(@PathVariable Long id) {
        if (universityService.deleteUniversity(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public List<UniversityResponse> searchUniversities(
            @RequestParam(required = false) String nameQuery,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) List<Long> specialtyIds,
            @RequestParam(required = false) List<Long> subjectIds,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Double maxScore) {

        return universityService.searchUniversities(
                nameQuery,
                regionId,
                subjectIds,
                specialtyIds,
                minScore,
                maxScore
        );
    }

    @GetMapping("/analytics/count")
    public Long getUniversitiesCount() {
        return universityService.getUniversitiesCount();
    }

    @GetMapping("/analytics/by-region")
    public List<Object[]> getUniversitiesByRegion() {
        return universityService.getUniversitiesByRegion();
    }

    @GetMapping("/by-specialty/{specialtyId}")
    public List<UniversityResponse> getUniversitiesBySpecialty(@PathVariable Long specialtyId) {
        return universityService.getUniversitiesBySpecialty(specialtyId);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<UniversityResponse>> importUniversities(@RequestParam("file") MultipartFile file,
                                                                       @RequestParam("mode") String mode) throws Exception {
        List<UniversityResponse> universities = universityService.importUniversities(file, mode);
        return ResponseEntity.ok(universities);
    }
}