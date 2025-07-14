package com.unidata.university_system.controllers;

import com.unidata.university_system.services.AssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    @Autowired
    private AssistantService assistantService;

    @PostMapping(value = "/query", consumes = {MediaType.TEXT_PLAIN_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Map<String, Object>> ask(@RequestBody String userQuery) {
        Map<String, Object> response = assistantService.processQuery(userQuery);
        return ResponseEntity.ok(response);
    }
}
