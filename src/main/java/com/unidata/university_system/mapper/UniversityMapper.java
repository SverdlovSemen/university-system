package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.UniversityRequest;
import com.unidata.university_system.dto.UniversityResponse;
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
        university.setName(request.name());
        university.setType(request.type());
        university.setAvgEgeScore(request.avgEgeScore());
        university.setCountryRanking(request.countryRanking());
        university.setCity(cityMapper.toCity(request.city()));
        return university;
    }

    public UniversityResponse fromUniversity(University university) {
        if (university == null) return null;
        return new UniversityResponse(
                university.getId(),
                university.getName(),
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