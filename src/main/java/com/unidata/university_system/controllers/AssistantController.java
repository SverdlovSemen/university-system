package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.gigachat.AssistantRequest;
import com.unidata.university_system.services.AssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    @Autowired
    private AssistantService assistantService;

    @PostMapping("/query")
    public ResponseEntity<?> queryAssistant(@RequestBody AssistantRequest request, @RequestHeader("Authorization") String authorization) {
        try {
            Object response = assistantService.queryGigaChat(request.getMessages(), request.getModel(), authorization.replace("Bearer ", ""));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error querying GigaChat: " + e.getMessage());
        }
    }
}
