package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
import com.unidata.university_system.models.City;
import com.unidata.university_system.models.University;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UniversityMapper {

    @Autowired
    private CityMapper cityMapper;

    @Autowired
    private FacultyMapper facultyMapper;

    public University toUniversity(UniversityRequest request) {
        if (request == null) return null;
        University university = new University();
        university.setId(request.id());
        university.setShortName(request.shortName()); // Изменено
        university.setFullName(request.fullName());   // Новое поле
        university.setType(request.type());
        university.setAvgEgeScore(request.avgEgeScore());
        university.setCountryRanking(request.countryRanking());

        // Создаем временный объект City только с ID
        City city = new City();
        city.setId(request.cityId());
        university.setCity(city);

        return university;
    }

    public UniversityResponse fromUniversity(University university) {
        if (university == null) return null;
        return new UniversityResponse(
                university.getId(),
                university.getShortName(), // Изменено
                university.getFullName(),  // Новое поле
                university.getType(),
                university.getAvgEgeScore(),
                university.getCountryRanking(),
                cityMapper.fromCity(university.getCity()),
                university.getFaculties() != null ?
                        facultyMapper.fromFacultyList(university.getFaculties()) : null
        );
    }

    public List<UniversityResponse> fromUniversityList(List<University> universities) {
        if (universities == null) return Collections.emptyList();
        return universities.stream()
                .map(this::fromUniversity)
                .collect(Collectors.toList());
    }
}