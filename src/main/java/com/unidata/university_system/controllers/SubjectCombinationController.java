package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.services.SubjectCombinationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
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

    @PutMapping("/specialty/{specialtyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SubjectCombinationResponse> replaceSubjectCombinations(
            @PathVariable Long specialtyId,
            @Valid @RequestBody List<SubjectCombinationRequest> requests
    ) {
        return subjectCombinationService.replaceSubjects(specialtyId, requests);
    }
}