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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.models.User;

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
    private UserRepository userRepository;

    @Autowired
    private UniversityEmployeeRepository universityEmployeeRepository;

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
        // Authorization: only ADMIN or EDITOR belonging to the university can create
        checkCanModifyUniversity(request.universityId());

        Faculty faculty = facultyMapper.toFaculty(request);
        Faculty savedFaculty = facultyRepository.save(faculty);
        return facultyMapper.fromFaculty(savedFaculty);
    }

    public Optional<FacultyResponse> updateFaculty(Long id, FacultyRequest request) {
        Optional<Faculty> existingFaculty = facultyRepository.findById(id);
        if (existingFaculty.isPresent()) {
            Long uniId = request.universityId() != null ? request.universityId() : existingFaculty.get().getUniversity().getId();
            checkCanModifyUniversity(uniId);

            Faculty updatedFaculty = facultyMapper.toFaculty(request);
            updatedFaculty.setId(id);
            Faculty savedFaculty = facultyRepository.save(updatedFaculty);
            return Optional.of(facultyMapper.fromFaculty(savedFaculty));
        }
        return Optional.empty();
    }

    public boolean deleteFaculty(Long id) {
        Optional<Faculty> existing = facultyRepository.findById(id);
        if (existing.isPresent()) {
            Long uniId = existing.get().getUniversity() != null ? existing.get().getUniversity().getId() : null;
            if (uniId != null) checkCanModifyUniversity(uniId);
            facultyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private void checkCanModifyUniversity(Long universityId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new AccessDeniedException("Unauthorized");
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AccessDeniedException("User not found"));
        if (user.getRole() != null && "ROLE_ADMIN".equals(user.getRole().getName())) return;
        if (user.getRole() != null && ("ROLE_EDITOR".equals(user.getRole().getName()) || "ROLE_UNIVERSITY_ADMIN".equals(user.getRole().getName()))) {
            boolean ok = universityEmployeeRepository.existsByUniversityIdAndUserId(universityId, user.getId());
            if (!ok) throw new AccessDeniedException("Not allowed to modify this university");
            return;
        }
        throw new AccessDeniedException("Not allowed");
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
                faculty.setFullName(dto.getName());
                faculty.setUniversity(university);
                savedFaculties.add(facultyRepository.save(faculty));
            }
        } catch (Exception e) {
            throw new Exception("Failed to process faculties CSV: " + e.getMessage(), e);
        }
        return savedFaculties;
    }

    @Transactional
    public void transferProgramsAndDeleteFaculty(Long sourceFacultyId, Long targetFacultyId) {
        System.out.println("transferProgramsAndDeleteFaculty вызван с параметрами:");
        System.out.println("sourceFacultyId: " + sourceFacultyId);
        System.out.println("targetFacultyId: " + targetFacultyId);

        // Проверяем существование исходного факультета
        Faculty sourceFaculty = facultyRepository.findById(sourceFacultyId)
                .orElseThrow(() -> new IllegalArgumentException("Факультет с ID " + sourceFacultyId + " не найден"));

        System.out.println("Исходный факультет найден: " + sourceFaculty.getFullName());

        // Проверяем существование целевого факультета
        Faculty targetFaculty = facultyRepository.findById(targetFacultyId)
                .orElseThrow(() -> new IllegalArgumentException("Факультет с ID " + targetFacultyId + " не найден"));

        System.out.println("Целевой факультет найден: " + targetFaculty.getFullName());

        // Проверяем права доступа
        checkCanModifyUniversity(sourceFaculty.getUniversity().getId());

        System.out.println("Права доступа проверены успешно");

        // Вызываем процедуру PostgreSQL для переноса программ и удаления факультета
        // Транзакцией управляет Spring (@Transactional)
        try {
            System.out.println("Вызов процедуры safe_move_programs_and_delete_faculty...");
            facultyRepository.safeMoveAndDeleteFaculty(sourceFacultyId, targetFacultyId, true);
            System.out.println("Процедура выполнена успешно");
        } catch (Exception e) {
            System.err.println("Ошибка при вызове процедуры: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalArgumentException("Ошибка при переносе программ: " + e.getMessage(), e);
        }
    }
}