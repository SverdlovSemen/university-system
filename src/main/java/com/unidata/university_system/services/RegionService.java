package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.RegionRequest;
import com.unidata.university_system.dto.RegionResponse;
import com.unidata.university_system.dto.csv.RegionCsvDTO;
import com.unidata.university_system.mapper.RegionMapper;
import com.unidata.university_system.models.Region;
import com.unidata.university_system.repositories.RegionRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
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

    @Transactional
    public List<Region> importRegions(MultipartFile file, String mode) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is missing or empty");
        }
        if (!"ADD".equalsIgnoreCase(mode) && !"REPLACE".equalsIgnoreCase(mode)) {
            throw new IllegalArgumentException("Invalid import mode: " + mode + ". Use ADD or REPLACE.");
        }

        List<Region> savedRegions = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            CsvToBean<RegionCsvDTO> csvToBean = new CsvToBeanBuilder<RegionCsvDTO>(reader)
                    .withType(RegionCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (RegionCsvDTO dto : csvToBean) {
                String name = dto.getName();
                if (name == null || name.trim().isEmpty()) {
                    throw new IllegalArgumentException("Region name is missing or empty in CSV");
                }
                name = name.trim();

                Optional<Region> optionalExisting = regionRepository.findByNameIgnoreCase(name);
                if ("ADD".equalsIgnoreCase(mode)) {
                    if (optionalExisting.isEmpty()) {
                        Region newRegion = new Region();
                        newRegion.setName(name);
                        savedRegions.add(regionRepository.save(newRegion));
                    }
                } else {
                    Region region = optionalExisting.orElseGet(Region::new);
                    region.setName(name);
                    savedRegions.add(regionRepository.save(region));
                }
            }
        } catch (Exception e) {
            log.error("Failed to process regions CSV: {}", e.getMessage(), e);
            throw new Exception("Failed to process regions CSV: " + e.getMessage(), e);
        }
        return savedRegions;
    }


}