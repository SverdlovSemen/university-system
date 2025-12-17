package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.UniversityApplicationRequest;
import com.unidata.university_system.dto.UniversityApplicationResponse;
import com.unidata.university_system.services.UniversityApplicationService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/university-applications")
public class UniversityApplicationController {

    @Autowired
    private UniversityApplicationService applicationService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UniversityApplicationResponse> createApplication(
            @Valid @RequestBody UniversityApplicationRequest request) {
        log.info("Received university application request for: {}", request.getFullName());
        try {
            UniversityApplicationResponse response = applicationService.createApplication(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating university application", e);
            throw new RuntimeException("Ошибка при создании заявки: " + e.getMessage());
        }
    }

    @GetMapping("/my-applications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UniversityApplicationResponse>> getMyApplications() {
        List<UniversityApplicationResponse> applications = applicationService.getUserApplications();
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/has-active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Boolean> hasActiveApplication() {
        boolean hasActive = applicationService.hasActiveApplication();
        return ResponseEntity.ok(hasActive);
    }
}

