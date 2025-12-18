package com.unidata.university_system.services;

import com.unidata.university_system.dto.DisciplineRequest;
import com.unidata.university_system.dto.DisciplineResponse;
import com.unidata.university_system.dto.ProgramRequest;
import com.unidata.university_system.models.Discipline;
import com.unidata.university_system.models.Faculty;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.StudyForm;
import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.DisciplineRepository;
import com.unidata.university_system.repositories.FacultyRepository;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.repositories.SpecialtyRepository;
import com.unidata.university_system.repositories.StudyFormRepository;
import com.unidata.university_system.repositories.UniversityEmployeeRepository;
import com.unidata.university_system.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProgramService {
    private final DisciplineRepository disciplineRepository;
    private final ProgramRepository programRepository;
    private final FacultyRepository facultyRepository;
    private final SpecialtyRepository specialtyRepository;
    private final UserRepository userRepository;
    private final UniversityEmployeeRepository universityEmployeeRepository;
    private final StudyFormRepository studyFormRepository;

    @Autowired
    public ProgramService(DisciplineRepository disciplineRepository,
                         ProgramRepository programRepository,
                         FacultyRepository facultyRepository,
                         SpecialtyRepository specialtyRepository,
                         UserRepository userRepository,
                         UniversityEmployeeRepository universityEmployeeRepository,
                         StudyFormRepository studyFormRepository) {
        this.disciplineRepository = disciplineRepository;
        this.programRepository = programRepository;
        this.facultyRepository = facultyRepository;
        this.specialtyRepository = specialtyRepository;
        this.userRepository = userRepository;
        this.universityEmployeeRepository = universityEmployeeRepository;
        this.studyFormRepository = studyFormRepository;
    }

    public List<DisciplineResponse> getDisciplinesForProgram(Long programId) {
        List<Discipline> disciplines = disciplineRepository.findByProgramIdOrderBySemesterAsc(programId);
        return disciplines.stream()
                .map(d -> new DisciplineResponse(d.getId(), d.getName(), d.getSemester(), d.getTotalHours()))
                .toList();
    }

    @Transactional
    public Discipline createDiscipline(Long programId, DisciplineRequest request) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Программа не найдена"));

        checkCanModifyUniversity(program.getFaculty().getUniversity().getId());

        Discipline discipline = new Discipline();
        discipline.setProgram(program);
        discipline.setName(request.name());
        discipline.setSemester(request.semester());
        discipline.setTotalHours(request.totalHours());

        return disciplineRepository.save(discipline);
    }

    @Transactional
    public Program createProgram(ProgramRequest request) {
        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new IllegalArgumentException("Факультет не найден"));

        Specialty specialty = specialtyRepository.findById(request.specialtyId())
                .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));

        checkCanModifyUniversity(faculty.getUniversity().getId());

        Program program = new Program();
        program.setFaculty(faculty);
        program.setSpecialization(specialty);
        program.setProgramDescription(request.programDescription());
        program.setDuration(request.duration());
        program.setMobilityOption(request.mobilityOption() != null ? request.mobilityOption() : false);
        program.setTeachingLanguage(request.teachingLanguage());
        program.setUpdatedAt(LocalDateTime.now());

        // Устанавливаем форму обучения
        if (request.studyFormId() != null) {
            StudyForm studyForm = studyFormRepository.findById(request.studyFormId())
                    .orElseThrow(() -> new IllegalArgumentException("Форма обучения не найдена"));
            program.setStudyForm(studyForm);
        }

        return programRepository.save(program);
    }

    @Transactional
    public Program updateProgram(Long programId, ProgramRequest request) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Программа не найдена"));

        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new IllegalArgumentException("Факультет не найден"));

        Specialty specialty = specialtyRepository.findById(request.specialtyId())
                .orElseThrow(() -> new IllegalArgumentException("Специальность не найдена"));

        checkCanModifyUniversity(faculty.getUniversity().getId());

        program.setFaculty(faculty);
        program.setSpecialization(specialty);
        program.setProgramDescription(request.programDescription());
        program.setDuration(request.duration());
        program.setMobilityOption(request.mobilityOption() != null ? request.mobilityOption() : false);
        program.setTeachingLanguage(request.teachingLanguage());
        program.setUpdatedAt(LocalDateTime.now());

        // Устанавливаем форму обучения
        if (request.studyFormId() != null) {
            StudyForm studyForm = studyFormRepository.findById(request.studyFormId())
                    .orElseThrow(() -> new IllegalArgumentException("Форма обучения не найдена"));
            program.setStudyForm(studyForm);
        } else {
            program.setStudyForm(null);
        }

        return programRepository.save(program);
    }

    @Transactional
    public void deleteProgram(Long programId) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new IllegalArgumentException("Программа не найдена"));

        checkCanModifyUniversity(program.getFaculty().getUniversity().getId());

        programRepository.delete(program);
    }

    @Transactional
    public Discipline updateDiscipline(Long programId, Long disciplineId, DisciplineRequest request) {
        Discipline discipline = disciplineRepository.findById(disciplineId)
                .orElseThrow(() -> new IllegalArgumentException("Дисциплина не найдена"));
        if (!discipline.getProgram().getId().equals(programId)) {
            throw new IllegalArgumentException("Дисциплина не принадлежит программе");
        }
        checkCanModifyUniversity(discipline.getProgram().getFaculty().getUniversity().getId());
        discipline.setName(request.name());
        discipline.setSemester(request.semester());
        discipline.setTotalHours(request.totalHours());
        return disciplineRepository.save(discipline);
    }

    public Discipline getDiscipline(Long programId, Long disciplineId) {
        Discipline discipline = disciplineRepository.findById(disciplineId)
                .orElseThrow(() -> new IllegalArgumentException("Дисциплина не найдена"));
        if (!discipline.getProgram().getId().equals(programId)) {
            throw new IllegalArgumentException("Дисциплина не принадлежит программе");
        }
        return discipline;
    }

    @Transactional
    public void deleteDiscipline(Long programId, Long disciplineId) {
        Discipline discipline = disciplineRepository.findById(disciplineId)
                .orElseThrow(() -> new IllegalArgumentException("Дисциплина не найдена"));
        if (!discipline.getProgram().getId().equals(programId)) {
            throw new IllegalArgumentException("Дисциплина не принадлежит программе");
        }
        checkCanModifyUniversity(discipline.getProgram().getFaculty().getUniversity().getId());
        disciplineRepository.delete(discipline);
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
}
