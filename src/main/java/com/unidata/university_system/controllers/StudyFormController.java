package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.StudyFormResponse;
import com.unidata.university_system.models.StudyForm;
import com.unidata.university_system.repositories.StudyFormRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class StudyFormController {

    private final StudyFormRepository studyFormRepository;

    @Autowired
    public StudyFormController(StudyFormRepository studyFormRepository) {
        this.studyFormRepository = studyFormRepository;
    }

    @GetMapping("/api/study-forms")
    public ResponseEntity<List<StudyFormResponse>> getAllStudyForms() {
        List<StudyForm> studyForms = studyFormRepository.findAll();
        List<StudyFormResponse> response = studyForms.stream()
                .map(sf -> new StudyFormResponse(sf.getId(), sf.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}

