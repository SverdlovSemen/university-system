package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.RegionRequest;
import com.unidata.university_system.dto.RegionResponse;
import com.unidata.university_system.models.Region;
import com.unidata.university_system.services.RegionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
public class RegionController {

    @Autowired
    private RegionService regionService;

    @GetMapping
    public List<RegionResponse> getAllRegions() {
        return regionService.getAllRegions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegionResponse> getRegionById(@PathVariable Long id) {
        return regionService.getRegionById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public RegionResponse createRegion(@RequestBody RegionRequest request) {
        return regionService.createRegion(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RegionResponse> updateRegion(@PathVariable Long id, @RequestBody RegionRequest request) {
        return regionService.updateRegion(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegion(@PathVariable Long id) {
        if (regionService.deleteRegion(id)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/import")
    public ResponseEntity<List<Region>> importRegions(@RequestParam("file") MultipartFile file) {
        try {
            List<Region> regions = regionService.importRegions(file);
            return ResponseEntity.ok(regions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}