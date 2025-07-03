package com.unidata.university_system.services;

import com.unidata.university_system.models.City;
import com.unidata.university_system.repositories.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CityService {

    @Autowired
    private CityRepository cityRepository;

    public List<City> getAllCities() {
        return cityRepository.findAll();
    }

    public Optional<City> getCityById(Long id) {
        return cityRepository.findById(id);
    }

    public City createCity(City city) {
        return cityRepository.save(city);
    }

    public Optional<City> updateCity(Long id, City updatedCity) {
        Optional<City> existingCity = cityRepository.findById(id);
        if (existingCity.isPresent()) {
            updatedCity.setId(id);
            return Optional.of(cityRepository.save(updatedCity));
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