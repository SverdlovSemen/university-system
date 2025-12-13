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
        university.setFullName(request.fullName());
        university.setAbbreviation(request.abbreviation());
        university.setType(request.type());
        university.setOwnershipType(request.ownershipType());
        university.setFoundedYear(request.foundedYear());
        university.setWebsite(request.website());
        university.setAdminEmail(request.adminEmail());
        university.setAdminPhone(request.adminPhone());
        university.setAccreditationNumber(request.accreditationNumber());
        university.setAccreditationExpiryDate(request.accreditationExpiryDate());

        if (request.cityId() != null) {
            City city = new City();
            city.setId(request.cityId());
            university.setCity(city);
        }

        return university;
    }

    public UniversityResponse fromUniversity(University university) {
        if (university == null) return null;
        return new UniversityResponse(
                university.getId(),
                university.getFullName(),
                university.getAbbreviation(),
                university.getType(),
                university.getOwnershipType(),
                university.getCity() != null ? cityMapper.fromCity(university.getCity()) : null,
                university.getFoundedYear(),
                university.getWebsite(),
                university.getAdminEmail(),
                university.getAdminPhone(),
                university.getAccreditationNumber(),
                university.getAccreditationExpiryDate(),
                university.getStatus() != null ? university.getStatus().getName() : null,
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