package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.InfrastructureResponse;
import com.unidata.university_system.services.InfrastructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/infrastructure")
@RequiredArgsConstructor
public class InfrastructureController {

    private final InfrastructureService infrastructureService;

    @GetMapping("/university/{universityId}")
    public ResponseEntity<List<InfrastructureResponse>> getInfrastructureByUniversity(@PathVariable Long universityId) {
        return ResponseEntity.ok(infrastructureService.getInfrastructureByUniversity(universityId));
    }
}
