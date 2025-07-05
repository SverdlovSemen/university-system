package com.unidata.university_system.services;

import com.unidata.university_system.dto.CityRequest;
import com.unidata.university_system.dto.CityResponse;
import com.unidata.university_system.mapper.CityMapper;
import com.unidata.university_system.models.City;
import com.unidata.university_system.repositories.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CityService {

    @Autowired
    private CityRepository cityRepository;

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
}