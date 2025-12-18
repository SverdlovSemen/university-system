package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.*;
import com.unidata.university_system.models.*;
import com.unidata.university_system.repositories.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/programs/{programId}/specialization-subjects")
public class ProgramSubjectController {

    private final ProgramRepository programRepository;
    private final SpecializationSubjectRepository specializationSubjectRepository;
    private final SubjectMinScoreRepository subjectMinScoreRepository;
    private final ProgramSubjectRepository programSubjectRepository;
    private final AdmissionConditionRepository admissionConditionRepository;

    @Autowired
    public ProgramSubjectController(
            ProgramRepository programRepository,
            SpecializationSubjectRepository specializationSubjectRepository,
            SubjectMinScoreRepository subjectMinScoreRepository,
            ProgramSubjectRepository programSubjectRepository,
            AdmissionConditionRepository admissionConditionRepository
    ) {
        this.programRepository = programRepository;
        this.specializationSubjectRepository = specializationSubjectRepository;
        this.subjectMinScoreRepository = subjectMinScoreRepository;
        this.programSubjectRepository = programSubjectRepository;
        this.admissionConditionRepository = admissionConditionRepository;
    }

    /**
     * Получить все предметы специализации для программы с учетом года (для условий поступления)
     */
    @GetMapping
    public ResponseEntity<?> getSpecializationSubjects(
            @PathVariable Long programId,
            @RequestParam(required = false) Integer year
    ) {
        Optional<Program> programOpt = programRepository.findById(programId);
        if (programOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOpt.get();
        Long specialtyId = program.getSpecialization().getId();

        // Получаем все предметы для данной специализации
        List<SpecializationSubject> specializationSubjects =
                specializationSubjectRepository.findBySpecializationId(specialtyId);

        // Если год не указан, используем текущий год
        int targetYear = (year != null) ? year : java.time.Year.now().getValue();

        List<SpecializationSubjectResponse> responses = specializationSubjects.stream()
                .map(ss -> {
                    // Получаем минимальный балл для предмета в указанном году
                    Optional<SubjectMinScore> minScoreOpt =
                            subjectMinScoreRepository.findBySubjectIdAndYear(ss.getSubjectId(), targetYear);

                    Integer minScoreForYear = minScoreOpt.map(SubjectMinScore::getMinScore).orElse(28);

                    return new SpecializationSubjectResponse(
                            ss.getSubject().getId(),
                            ss.getSubject().getName(),
                            ss.getIsRequired(),
                            minScoreForYear
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Получить предметы для конкретного условия поступления
     */
    @GetMapping("/admission-condition/{admissionConditionId}")
    public ResponseEntity<?> getProgramSubjectsForAdmissionCondition(
            @PathVariable Long programId,
            @PathVariable Long admissionConditionId
    ) {
        Optional<AdmissionCondition> admissionConditionOpt =
                admissionConditionRepository.findById(admissionConditionId);

        if (admissionConditionOpt.isEmpty() ||
            !admissionConditionOpt.get().getProgram().getId().equals(programId)) {
            return ResponseEntity.notFound().build();
        }

        List<ProgramSubject> programSubjects =
                programSubjectRepository.findByAdmissionConditionId(admissionConditionId);

        List<ProgramSubjectResponse> responses = programSubjects.stream()
                .map(ps -> new ProgramSubjectResponse(
                        ps.getSubject().getId(),
                        ps.getSubject().getName(),
                        ps.getExamNumber(),
                        ps.getMinScore()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Обновить предметы для условия поступления
     */
    @PutMapping("/admission-condition/{admissionConditionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    @Transactional
    public ResponseEntity<?> updateProgramSubjectsForAdmissionCondition(
            @PathVariable Long programId,
            @PathVariable Long admissionConditionId,
            @Valid @RequestBody ProgramSubjectsUpdateRequest request
    ) {
        Optional<AdmissionCondition> admissionConditionOpt =
                admissionConditionRepository.findById(admissionConditionId);

        if (admissionConditionOpt.isEmpty() ||
            !admissionConditionOpt.get().getProgram().getId().equals(programId)) {
            return ResponseEntity.notFound().build();
        }

        AdmissionCondition admissionCondition = admissionConditionOpt.get();
        Program program = admissionCondition.getProgram();
        Long specialtyId = program.getSpecialization().getId();
        Integer year = admissionCondition.getYear();

        // Получаем все обязательные предметы для специализации
        List<SpecializationSubject> specializationSubjects =
                specializationSubjectRepository.findBySpecializationId(specialtyId);

        // Проверяем, что все обязательные предметы включены
        List<Long> requiredSubjectIds = specializationSubjects.stream()
                .filter(SpecializationSubject::getIsRequired)
                .map(SpecializationSubject::getSubjectId)
                .collect(Collectors.toList());

        List<Long> providedSubjectIds = request.subjects().stream()
                .map(ProgramSubjectRequest::subjectId)
                .collect(Collectors.toList());

        if (!providedSubjectIds.containsAll(requiredSubjectIds)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Все обязательные предметы должны быть включены");
        }

        // Проверяем минимальные баллы
        for (ProgramSubjectRequest subjectRequest : request.subjects()) {
            Optional<SubjectMinScore> minScoreOpt =
                    subjectMinScoreRepository.findBySubjectIdAndYear(subjectRequest.subjectId(), year);

            int minAllowedScore = minScoreOpt.map(SubjectMinScore::getMinScore).orElse(28);

            if (subjectRequest.minScore() != null &&
                subjectRequest.minScore().intValue() < minAllowedScore) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Минимальный балл для предмета не может быть ниже " + minAllowedScore);
            }
        }

        // Удаляем старые записи через findByAdmissionConditionId и deleteAll
        List<ProgramSubject> existingSubjects = programSubjectRepository.findByAdmissionConditionId(admissionConditionId);
        if (!existingSubjects.isEmpty()) {
            programSubjectRepository.deleteAll(existingSubjects);
            programSubjectRepository.flush();
        }

        // Создаем новые записи
        List<ProgramSubject> newSubjects = request.subjects().stream()
                .map(subjectRequest -> {
                    ProgramSubject programSubject = new ProgramSubject();
                    programSubject.setAdmissionCondition(admissionCondition);

                    Subject subject = new Subject();
                    subject.setId(subjectRequest.subjectId());
                    programSubject.setSubject(subject);

                    programSubject.setExamNumber(subjectRequest.examNumber());
                    programSubject.setMinScore(subjectRequest.minScore());

                    return programSubject;
                })
                .collect(Collectors.toList());

        // Сохраняем все записи одним батчем
        programSubjectRepository.saveAll(newSubjects);
        programSubjectRepository.flush();

        // Возвращаем обновленный список
        List<ProgramSubject> updatedSubjects =
                programSubjectRepository.findByAdmissionConditionId(admissionConditionId);

        List<ProgramSubjectResponse> responses = updatedSubjects.stream()
                .map(ps -> new ProgramSubjectResponse(
                        ps.getSubject().getId(),
                        ps.getSubject().getName(),
                        ps.getExamNumber(),
                        ps.getMinScore()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }
}

