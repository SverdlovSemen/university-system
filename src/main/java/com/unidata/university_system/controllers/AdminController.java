package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AdminStatsResponse;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.repositories.UniversityApplicationRepository;
import com.unidata.university_system.repositories.UniversityRepository;
import com.unidata.university_system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final UserRepository userRepository;
    private final UniversityRepository universityRepository;
    private final ProgramRepository programRepository;
    private final UniversityApplicationRepository applicationRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminStatsResponse> getSystemStats() {
        long totalUsers = userRepository.count();
        long totalUniversities = universityRepository.count();
        long totalPrograms = programRepository.count();
        long pendingApplications = applicationRepository.count();

        AdminStatsResponse stats = new AdminStatsResponse(
                totalUsers,
                totalUniversities,
                totalPrograms,
                pendingApplications
        );

        return ResponseEntity.ok(stats);
    }
}

