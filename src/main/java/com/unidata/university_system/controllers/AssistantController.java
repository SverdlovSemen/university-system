package com.unidata.university_system.controllers;

import com.unidata.university_system.services.AssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    @Autowired
    private AssistantService assistantService;

    @PostMapping("/query")
    public ResponseEntity<?> ask(@RequestBody String userQuery) {
        String answer = assistantService.processQuery(userQuery);
        if (answer == null || answer.isBlank()) {
            return ResponseEntity.ok("Извините, информация по вашему запросу отсутствует.");
        }
        return ResponseEntity.ok(answer);
    }
}
