package com.unidata.university_system.controllers;

import com.unidata.university_system.services.UniversityImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/universities/import")
public class UniversityImportController {
    @Autowired
    private UniversityImportService importService;

    @PostMapping
    public ResponseEntity<?> importUniversities(@RequestParam("file") MultipartFile file,
                                                @RequestParam("mode") String mode) {
        try {
            importService.importFromJson(file, mode);
            return ResponseEntity.ok().body("Импорт успешно завершён");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка импорта: " + e.getMessage());
        }
    }
}
