package com.unidata.university_system.controllers;

import com.unidata.university_system.models.RequiredSubject;
import com.unidata.university_system.services.RequiredSubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/required-subjects")
public class RequiredSubjectController {

    @Autowired
    private RequiredSubjectService requiredSubjectService;

    @PostMapping("/import")
    public ResponseEntity<List<RequiredSubject>> importRequiredSubjects(@RequestParam("file") MultipartFile file) {
        try {
            List<RequiredSubject> requiredSubjects = requiredSubjectService.importRequiredSubjects(file);
            return ResponseEntity.ok(requiredSubjects);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}