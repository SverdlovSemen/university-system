package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.dto.SubjectRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.dto.csv.SpecialtyCsvDTO;
import com.unidata.university_system.mapper.SpecialtyMapper;
import com.unidata.university_system.mapper.SubjectCombinationMapper;
import com.unidata.university_system.models.EducationLevel;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.models.SpecializationSubject;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.Subject;
import com.unidata.university_system.repositories.EducationLevelRepository;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.repositories.SpecializationSubjectRepository;
import com.unidata.university_system.repositories.SpecialtyRepository;
import com.unidata.university_system.repositories.SubjectRepository;
import jakarta.persistence.EntityNotFoundException;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.repositories.FacultyRepository;
import com.unidata.university_system.models.User;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
    private final ProgramRepository programRepository;
    private final SpecializationSubjectRepository specializationSubjectRepository;
    private final SubjectRepository subjectRepository;
    private final EducationLevelRepository educationLevelRepository;
    private final SpecialtyMapper specialtyMapper;
    private final SubjectCombinationMapper subjectCombinationMapper;

    @Autowired
    public SpecialtyService(
            SpecialtyRepository specialtyRepository,
            ProgramRepository programRepository,
            SpecializationSubjectRepository specializationSubjectRepository,
            SubjectRepository subjectRepository,
            EducationLevelRepository educationLevelRepository,
            SpecialtyMapper specialtyMapper,
            SubjectCombinationMapper subjectCombinationMapper
    ) {
        this.specialtyRepository = specialtyRepository;
        this.programRepository = programRepository;
        this.specializationSubjectRepository = specializationSubjectRepository;
        this.subjectRepository = subjectRepository;
        this.educationLevelRepository = educationLevelRepository;
        this.specialtyMapper = specialtyMapper;
        this.subjectCombinationMapper = subjectCombinationMapper;
    }

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private UniversityEmployeeRepository universityEmployeeRepository;

        @Autowired
        private FacultyRepository facultyRepository;

    public List<SpecialtyResponse> findSpecialtiesBySubjects(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Specialty> allSpecialties = specialtyRepository.findAll();
        return allSpecialties.stream()
                .filter(specialty -> hasMatchingSubjects(specialty, subjectIds))
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ))
                .collect(Collectors.toList());
    }

    private boolean hasMatchingSubjects(Specialty specialty, List<Long> subjectIds) {
        List<SpecializationSubject> subjects = specializationSubjectRepository.findBySpecializationId(specialty.getId());
        if (subjects.isEmpty()) {
            return false;
        }

        return subjects.stream()
                .map(SpecializationSubject::getSubjectId)
                .allMatch(subjectIds::contains);
    }

    public List<SpecialtyResponse> getAllSpecialties() {
        List<Specialty> specialties = specialtyRepository.findAll();
        return specialties.stream()
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ))
                .collect(Collectors.toList());
    }

    public Optional<SpecialtyResponse> getSpecialtyById(Long id) {
        return specialtyRepository.findById(id)
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ));
    }

    @Transactional(readOnly = true)
    public SpecialtyResponse getSpecialtyByIdWithDetails(Long id) {
        Specialty specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Specialty not found"));

        Hibernate.initialize(specialty.getSpecializationSubjects());
        return specialtyMapper.fromSpecialty(
                specialty,
                resolveFacultyIds(specialty.getId()),
                subjectCombinationMapper.fromSpecializationSubjects(
                        specialty.getId(),
                        new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(specialty.getId()))
                )
        );
    }

    @Transactional
    public SpecialtyResponse createSpecialty(SpecialtyRequest request) {
                // Authorization: check editor belongs to target universities (faculties)
                if (request.facultyIds() != null && !request.facultyIds().isEmpty()) {
                        Long facultyId = request.facultyIds().get(0);
                        Long uniId = facultyRepository.findById(facultyId).map(f -> f.getUniversity().getId()).orElse(null);
                        if (uniId != null) checkCanModifyUniversity(uniId);
                }

                Specialty specialty = specialtyMapper.toSpecialty(request);
        if (request.educationLevelId() != null) {
            EducationLevel level = educationLevelRepository.findById(request.educationLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("Education level not found: " + request.educationLevelId()));
            specialty.setEducationLevel(level);
        }

        Specialty savedSpecialty = specialtyRepository.save(specialty);
        upsertPrograms(savedSpecialty, request.facultyIds());
        upsertSubjects(savedSpecialty.getId(), request.subjectCombinations());

        return getSpecialtyByIdWithDetails(savedSpecialty.getId());
    }

    @Transactional
    public Optional<SpecialtyResponse> updateSpecialty(Long id, SpecialtyRequest request) {
        return specialtyRepository.findById(id)
                .map(existingSpecialty -> {
                                                        if (request.facultyIds() != null && !request.facultyIds().isEmpty()) {
                                                                Long facultyId = request.facultyIds().get(0);
                                                                Long uniId = facultyRepository.findById(facultyId).map(f -> f.getUniversity().getId()).orElse(null);
                                                                if (uniId != null) checkCanModifyUniversity(uniId);
                                                        }
                    existingSpecialty.setName(request.name());
                    existingSpecialty.setProgramCode(request.programCode());
                    existingSpecialty.setDescription(request.description());

                    if (request.educationLevelId() != null) {
                        EducationLevel level = educationLevelRepository.findById(request.educationLevelId())
                                .orElseThrow(() -> new IllegalArgumentException("Education level not found: " + request.educationLevelId()));
                        existingSpecialty.setEducationLevel(level);
                    } else {
                        existingSpecialty.setEducationLevel(null);
                    }

                    Specialty saved = specialtyRepository.save(existingSpecialty);
                    upsertPrograms(saved, request.facultyIds());
                    upsertSubjects(saved.getId(), request.subjectCombinations());
                    return getSpecialtyByIdWithDetails(saved.getId());
                });
    }

    @Transactional
    public boolean deleteSpecialty(Long id) {
                Optional<Specialty> s = specialtyRepository.findById(id);
                if (s.isPresent()) {
                        // ensure user can modify university(ies) for this specialty
                        List<Program> progs = programRepository.findBySpecializationId(id);
                        if (!progs.isEmpty()) {
                                Long uniId = progs.get(0).getFaculty().getUniversity().getId();
                                if (uniId != null) checkCanModifyUniversity(uniId);
                        }

                        specializationSubjectRepository.deleteBySpecializationId(id);
                        programRepository.findBySpecializationId(id).forEach(programRepository::delete);
                        specialtyRepository.deleteById(id);
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

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> getSpecialtiesByFaculty(Long facultyId) {
        List<Specialty> specialties = specialtyRepository.findByFacultyId(facultyId);
        return specialties.stream()
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> getSpecialtiesByUniversity(Long universityId) {
        List<Specialty> specialties = specialtyRepository.findByUniversityId(universityId);
        return specialties.stream()
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> searchSpecialties(
            Long universityId,
            String query,
            String level,
            String form,
            String subject
    ) {
        List<Specialty> specialties = specialtyRepository.searchSpecialties(
                universityId,
                query,
                level,
                form,
                subject
        );

        return specialties.stream()
                .map(spec -> specialtyMapper.fromSpecialty(
                        spec,
                        resolveFacultyIds(spec.getId()),
                        subjectCombinationMapper.fromSpecializationSubjects(
                                spec.getId(),
                                new java.util.HashSet<>(specializationSubjectRepository.findBySpecializationId(spec.getId()))
                        )
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Specialty> importSpecialties(MultipartFile file) throws Exception {
        List<Specialty> savedSpecialties = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<SpecialtyCsvDTO> csvToBean = new CsvToBeanBuilder<SpecialtyCsvDTO>(reader)
                    .withType(SpecialtyCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (SpecialtyCsvDTO dto : csvToBean) {
                Specialty specialty = dto.getId() == null
                        ? new Specialty()
                        : specialtyRepository.findById(dto.getId()).orElse(new Specialty());

                specialty.setName(dto.getName());
                specialty.setProgramCode(dto.getProgramCode());
                specialty.setDescription(dto.getDescription());

                if (dto.getEducationLevelId() != null) {
                    EducationLevel level = educationLevelRepository.findById(dto.getEducationLevelId())
                            .orElseThrow(() -> new IllegalArgumentException("Education level not found: " + dto.getEducationLevelId()));
                    specialty.setEducationLevel(level);
                }

                Specialty saved = specialtyRepository.save(specialty);
                upsertPrograms(saved, dto.getFacultyIds());
                upsertSubjects(saved.getId(), null);
                savedSpecialties.add(saved);
            }
        } catch (Exception e) {
            throw new Exception("Failed to process specialties CSV: " + e.getMessage(), e);
        }
        return savedSpecialties;
    }

    private void upsertPrograms(Specialty specialty, List<Long> facultyIds) {
        if (facultyIds == null) return;

        List<Program> existing = programRepository.findBySpecializationId(specialty.getId());
        Set<Long> existingFacultyIds = existing.stream()
                .map(Program::getFaculty)
                .filter(Objects::nonNull)
                .map(Faculty::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        for (Long facultyId : facultyIds) {
            if (!existingFacultyIds.contains(facultyId)) {
                Program program = new Program();
                Faculty faculty = new Faculty();
                faculty.setId(facultyId);
                program.setFaculty(faculty);
                program.setSpecialization(specialty);
                programRepository.save(program);
            }
        }
    }

    private void upsertSubjects(Long specialtyId, List<com.unidata.university_system.dto.SubjectCombinationRequest> subjectCombinations) {
        if (specialtyId == null || subjectCombinations == null) {
            return;
        }

        specializationSubjectRepository.deleteBySpecializationId(specialtyId);

        Set<Long> subjectIds = subjectCombinations.stream()
                .filter(req -> req.subjects() != null)
                .flatMap(req -> req.subjects().stream())
                .map(SubjectRequest::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new IllegalArgumentException("Specialty not found: " + specialtyId));

        for (Long subjectId : subjectIds) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + subjectId));

            SpecializationSubject entity = new SpecializationSubject();
            entity.setSpecializationId(specialtyId);
            entity.setSubjectId(subjectId);
            entity.setSpecialization(specialty);
            entity.setSubject(subject);
            entity.setIsRequired(true);
            specializationSubjectRepository.save(entity);
        }
    }

    private List<Long> resolveFacultyIds(Long specialtyId) {
        if (specialtyId == null) {
            return Collections.emptyList();
        }

        return programRepository.findBySpecializationId(specialtyId).stream()
                .map(Program::getFaculty)
                .filter(Objects::nonNull)
                .map(Faculty::getId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
}