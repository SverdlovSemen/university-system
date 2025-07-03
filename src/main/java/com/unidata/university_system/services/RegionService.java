package com.unidata.university_system.services;

import com.unidata.university_system.models.Region;
import com.unidata.university_system.repositories.RegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RegionService {

    @Autowired
    private RegionRepository regionRepository;

    public List<Region> getAllRegions() {
        return regionRepository.findAll();
    }

    public Optional<Region> getRegionById(Long id) {
        return regionRepository.findById(id);
    }

    public Region createRegion(Region region) {
        return regionRepository.save(region);
    }

    public Optional<Region> updateRegion(Long id, Region updatedRegion) {
        Optional<Region> existingRegion = regionRepository.findById(id);
        if (existingRegion.isPresent()) {
            updatedRegion.setId(id);
            return Optional.of(regionRepository.save(updatedRegion));
        }
        return Optional.empty();
    }

    public boolean deleteRegion(Long id) {
        if (regionRepository.existsById(id)) {
            regionRepository.deleteById(id);
            return true;
        }
        return false;
    }
}