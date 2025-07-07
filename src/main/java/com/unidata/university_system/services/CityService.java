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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    public List<City> importCities(MultipartFile file) throws Exception {
        List<City> savedCities = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<CityCsvDTO> csvToBean = new CsvToBeanBuilder<CityCsvDTO>(reader)
                    .withType(CityCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (CityCsvDTO dto : csvToBean) {
                Region region = regionRepository.findById(dto.getRegionId())
                        .orElseThrow(() -> new IllegalArgumentException("Region with ID " + dto.getRegionId() + " not found"));

                City city;
                if (dto.getId() == null) {
                    city = new City();
                } else {
                    city = cityRepository.findById(dto.getId())
                            .orElseThrow(() -> new IllegalArgumentException("City with ID " + dto.getId() + " not found"));
                }
                city.setName(dto.getName());
                city.setRegion(region);
                savedCities.add(cityRepository.save(city));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process cities CSV: " + e.getMessage(), e);
        }
        return savedCities;
    }
}