package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.services.SubjectCombinationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject-combinations")
public class SubjectCombinationController {

    @Autowired
    private SubjectCombinationService subjectCombinationService;

    @GetMapping("/specialty/{specialtyId}")
    public List<SubjectCombinationResponse> getSubjectCombinationsBySpecialtyId(@PathVariable Long specialtyId) {
        return subjectCombinationService.getSubjectCombinationsBySpecialtyId(specialtyId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SubjectCombinationResponse createSubjectCombination(@Valid @RequestBody SubjectCombinationRequest request) {
        return subjectCombinationService.createSubjectCombination(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SubjectCombinationResponse> updateSubjectCombination(@PathVariable Long id, @Valid @RequestBody SubjectCombinationRequest request) {
        return subjectCombinationService.updateSubjectCombination(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubjectCombination(@PathVariable Long id) {
        if (subjectCombinationService.deleteSubjectCombination(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}