package com.unidata.university_system.services;

import com.unidata.university_system.dto.RegionRequest;
import com.unidata.university_system.dto.RegionResponse;
import com.unidata.university_system.mapper.RegionMapper;
import com.unidata.university_system.models.Region;
import com.unidata.university_system.repositories.RegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RegionService {

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private RegionMapper regionMapper;

    public List<RegionResponse> getAllRegions() {
        return regionRepository.findAll().stream()
                .map(regionMapper::fromRegion)
                .collect(Collectors.toList());
    }

    public Optional<RegionResponse> getRegionById(Long id) {
        return regionRepository.findById(id)
                .map(regionMapper::fromRegion);
    }

    public RegionResponse createRegion(RegionRequest request) {
        Region region = regionMapper.toRegion(request);
        Region savedRegion = regionRepository.save(region);
        return regionMapper.fromRegion(savedRegion);
    }

    public Optional<RegionResponse> updateRegion(Long id, RegionRequest request) {
        Optional<Region> existingRegion = regionRepository.findById(id);
        if (existingRegion.isPresent()) {
            Region updatedRegion = regionMapper.toRegion(request);
            updatedRegion.setId(id); // Ensure ID is preserved
            Region savedRegion = regionRepository.save(updatedRegion);
            return Optional.of(regionMapper.fromRegion(savedRegion));
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