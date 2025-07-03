package com.unidata.university_system.controllers;

import com.unidata.university_system.models.SubjectCombination;
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
    public List<SubjectCombination> getAllSubjectCombinations() {
        return subjectCombinationService.getAllSubjectCombinations();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectCombination> getSubjectCombinationById(@PathVariable Long id) {
        return subjectCombinationService.getSubjectCombinationById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public SubjectCombination createSubjectCombination(@RequestBody SubjectCombination subjectCombination) {
        return subjectCombinationService.createSubjectCombination(subjectCombination);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectCombination> updateSubjectCombination(@PathVariable Long id, @RequestBody SubjectCombination updatedSubjectCombination) {
        return subjectCombinationService.updateSubjectCombination(id, updatedSubjectCombination)
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