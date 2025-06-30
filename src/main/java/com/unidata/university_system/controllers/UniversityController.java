package com.unidata.university_system.controllers;

import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.UniversityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/universities")
public class UniversityController {

    @Autowired
    private UniversityRepository universityRepository;

    @GetMapping
    public List<University> getAllUniversities() {
        return universityRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<University> createUniversity(@RequestBody University university) {
        University savedUniversity = universityRepository.save(university);
        return ResponseEntity.ok(savedUniversity);
    }
}