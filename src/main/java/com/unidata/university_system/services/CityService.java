package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.CityRequest;
import com.unidata.university_system.dto.CityResponse;
import com.unidata.university_system.dto.csv.CityCsvDTO;
import com.unidata.university_system.mapper.CityMapper;
import com.unidata.university_system.models.City;
import com.unidata.university_system.models.Region;
import com.unidata.university_system.repositories.CityRepository;
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
public class CityService {

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private CityMapper cityMapper;

    public List<CityResponse> getAllCities() {
        return cityRepository.findAll().stream()
                .map(cityMapper::fromCity)
                .collect(Collectors.toList());
    }

    public Optional<CityResponse> getCityById(Long id) {
        return cityRepository.findById(id)
                .map(cityMapper::fromCity);
    }

    public CityResponse createCity(CityRequest request) {
        City city = cityMapper.toCity(request);
        City savedCity = cityRepository.save(city);
        return cityMapper.fromCity(savedCity);
    }

    public Optional<CityResponse> updateCity(Long id, CityRequest request) {
        Optional<City> existingCity = cityRepository.findById(id);
        if (existingCity.isPresent()) {
            City updatedCity = cityMapper.toCity(request);
            updatedCity.setId(id); // Ensure ID is preserved
            City savedCity = cityRepository.save(updatedCity);
            return Optional.of(cityMapper.fromCity(savedCity));
        }
        return Optional.empty();
    }

    public boolean deleteCity(Long id) {
        if (cityRepository.existsById(id)) {
            cityRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public List<CityResponse> importCities(MultipartFile file, String mode) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is missing or empty");
        }

        if (!"ADD".equalsIgnoreCase(mode) && !"REPLACE".equalsIgnoreCase(mode)) {
            throw new IllegalArgumentException("Invalid import mode: " + mode + ". Use ADD or REPLACE.");
        }

        List<City> savedCities = new ArrayList<>();

        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            CsvToBean<CityCsvDTO> csvToBean = new CsvToBeanBuilder<CityCsvDTO>(reader)
                    .withType(CityCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (CityCsvDTO dto : csvToBean) {
                String name = dto.getName().trim();
                String regionName = dto.getRegionName().trim();

                if (name.isEmpty() || regionName.isEmpty()) {
                    throw new IllegalArgumentException("City name or region_name is missing in CSV");
                }

                Region region = regionRepository.findByNameIgnoreCase(regionName)
                        .orElseThrow(() -> new IllegalArgumentException("Region not found: " + regionName));

                Optional<City> existing = cityRepository.findByNameIgnoreCaseAndRegionId(name, region.getId());

                if ("ADD".equalsIgnoreCase(mode)) {
                    if (existing.isEmpty()) {
                        City newCity = new City();
                        newCity.setName(name);
                        newCity.setRegion(region);
                        savedCities.add(cityRepository.save(newCity));
                    }
                } else {
                    City city = existing.orElseGet(City::new);
                    city.setName(name);
                    city.setRegion(region);
                    savedCities.add(cityRepository.save(city));
                }
            }
        } catch (Exception e) {
            log.error("Failed to process cities CSV: {}", e.getMessage(), e);
            throw new Exception("Failed to process cities CSV: " + e.getMessage(), e);
        }

        // Преобразование List<City> в List<CityResponse> с помощью CityMapper
        return cityMapper.fromCityList(savedCities);
    }
}