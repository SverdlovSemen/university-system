package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.services.SubjectCombinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subject-combinations")
public class SubjectCombinationController {

    @Autowired
    private SubjectCombinationService subjectCombinationService;

    @GetMapping
    public List<SubjectCombinationResponse> getAllSubjectCombinations() {
        return subjectCombinationService.getAllSubjectCombinations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectCombinationResponse> getSubjectCombinationById(@PathVariable Long id) {
        return subjectCombinationService.getSubjectCombinationById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public SubjectCombinationResponse createSubjectCombination(@RequestBody SubjectCombinationRequest request) {
        return subjectCombinationService.createSubjectCombination(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectCombinationResponse> updateSubjectCombination(@PathVariable Long id, @RequestBody SubjectCombinationRequest request) {
        return subjectCombinationService.updateSubjectCombination(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubjectCombination(@PathVariable Long id) {
        if (subjectCombinationService.deleteSubjectCombination(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}