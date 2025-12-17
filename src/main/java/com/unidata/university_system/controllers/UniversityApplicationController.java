package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.UniversityApplicationRequest;
import com.unidata.university_system.dto.UniversityApplicationResponse;
import com.unidata.university_system.dto.UniversityApplicationWithUserResponse;
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

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UniversityApplicationWithUserResponse>> getPendingApplications() {
        log.info("Getting all pending applications");
        List<UniversityApplicationWithUserResponse> applications = applicationService.getPendingApplications();
        return ResponseEntity.ok(applications);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rejectApplication(@PathVariable Long id) {
        log.info("Rejecting application with ID: {}", id);
        try {
            applicationService.rejectApplication(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error rejecting application with ID: {}", id, e);
            throw new RuntimeException("Ошибка при отклонении заявки: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityApplicationResponse> approveApplication(@PathVariable Long id) {
        log.info("Approving application with ID: {}", id);
        try {
            UniversityApplicationResponse response = applicationService.approveApplication(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error approving application with ID: {}", id, e);
            throw new RuntimeException("Ошибка при одобрении заявки: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}/decline")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> declineOwnApplication(@PathVariable Long id) {
        log.info("User declining their own application with ID: {}", id);
        try {
            applicationService.declineOwnApplication(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error declining own application with ID: {}", id, e);
            throw new RuntimeException("Ошибка при отклонении заявки: " + e.getMessage());
        }
    }
}

