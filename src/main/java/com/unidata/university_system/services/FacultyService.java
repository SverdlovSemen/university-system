package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.FacultyRequest;
import com.unidata.university_system.dto.FacultyResponse;
import com.unidata.university_system.dto.csv.FacultyCsvDTO;
import com.unidata.university_system.mapper.FacultyMapper;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.University;
import com.unidata.university_system.repositories.FacultyRepository;
import com.unidata.university_system.repositories.UniversityRepository;
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
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private FacultyMapper facultyMapper;

    public List<FacultyResponse> getAllFaculties() {
        return facultyRepository.findAll().stream()
                .map(facultyMapper::fromFaculty)
                .collect(Collectors.toList());
    }

    public Optional<FacultyResponse> getFacultyById(Long id) {
        return facultyRepository.findById(id)
                .map(facultyMapper::fromFaculty);
    }

    public FacultyResponse createFaculty(FacultyRequest request) {
        Faculty faculty = facultyMapper.toFaculty(request);
        Faculty savedFaculty = facultyRepository.save(faculty);
        return facultyMapper.fromFaculty(savedFaculty);
    }

    public Optional<FacultyResponse> updateFaculty(Long id, FacultyRequest request) {
        Optional<Faculty> existingFaculty = facultyRepository.findById(id);
        if (existingFaculty.isPresent()) {
            Faculty updatedFaculty = facultyMapper.toFaculty(request);
            updatedFaculty.setId(id);
            Faculty savedFaculty = facultyRepository.save(updatedFaculty);
            return Optional.of(facultyMapper.fromFaculty(savedFaculty));
        }
        return Optional.empty();
    }

    public boolean deleteFaculty(Long id) {
        if (facultyRepository.existsById(id)) {
            facultyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<FacultyResponse> getFacultiesByUniversity(Long universityId) {
        return facultyRepository.findByUniversityId(universityId).stream()
                .map(facultyMapper::fromFaculty)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Faculty> importFaculties(MultipartFile file) throws Exception {
        List<Faculty> savedFaculties = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<FacultyCsvDTO> csvToBean = new CsvToBeanBuilder<FacultyCsvDTO>(reader)
                    .withType(FacultyCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (FacultyCsvDTO dto : csvToBean) {
                University university = universityRepository.findById(dto.getUniversityId())
                        .orElseThrow(() -> new IllegalArgumentException("University with ID " + dto.getUniversityId() + " not found"));

                Faculty faculty;
                if (dto.getId() == null) {
                    faculty = new Faculty();
                } else {
                    faculty = facultyRepository.findById(dto.getId())
                            .orElseThrow(() -> new IllegalArgumentException("Faculty with ID " + dto.getId() + " not found"));
                }
                faculty.setName(dto.getName());
                faculty.setUniversity(university);
                savedFaculties.add(facultyRepository.save(faculty));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process faculties CSV: " + e.getMessage(), e);
        }
        return savedFaculties;
    }
}