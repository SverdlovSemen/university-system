package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.CityRequest;
import com.unidata.university_system.dto.CityResponse;
import com.unidata.university_system.models.City;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CityMapper {

    @Autowired
    private RegionMapper regionMapper;

    public City toCity(CityRequest request) {
        if (request == null) return null;
        City city = new City();
        city.setId(request.id());
        city.setName(request.name());
        city.setRegion(regionMapper.toRegion(request.region()));
        return city;
    }

    public CityResponse fromCity(City city) {
        if (city == null) return null;
        return new CityResponse(
                city.getId(),
                city.getName(),
                regionMapper.fromRegion(city.getRegion())
        );
    }

    public List<CityResponse> fromCityList(List<City> cities) {
        if (cities == null) return Collections.emptyList();
        return cities.stream()
                .map(this::fromCity)
                .collect(Collectors.toList());
    }
}