package com.unidata.university_system.controllers;

import com.unidata.university_system.dto.AdmissionConditionRequest;
import com.unidata.university_system.dto.AdmissionConditionResponse;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.AdmissionCondition;
import com.unidata.university_system.models.Program;
import com.unidata.university_system.repositories.AdmissionConditionRepository;
import com.unidata.university_system.repositories.ProgramRepository;
import com.unidata.university_system.services.AdmissionConditionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/programs/{programId}/admission-conditions")
public class AdmissionConditionController {

    private final AdmissionConditionRepository admissionConditionRepository;
    private final ProgramRepository programRepository;
    private final AdmissionConditionService admissionConditionService;

    @Autowired
    public AdmissionConditionController(
            AdmissionConditionRepository admissionConditionRepository,
            ProgramRepository programRepository,
            AdmissionConditionService admissionConditionService
    ) {
        this.admissionConditionRepository = admissionConditionRepository;
        this.programRepository = programRepository;
        this.admissionConditionService = admissionConditionService;
    }

    @GetMapping
    public ResponseEntity<List<AdmissionConditionResponse>> getAdmissionConditions(@PathVariable Long programId) {
        Optional<Program> programOpt = programRepository.findById(programId);
        if (programOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOpt.get();
        List<AdmissionConditionResponse> responses = program.getAdmissionConditions().stream()
                .map(this::mapAdmissionCondition)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdmissionConditionResponse> getAdmissionConditionById(
            @PathVariable Long programId,
            @PathVariable Long id
    ) {
        Optional<AdmissionCondition> admissionConditionOpt = admissionConditionRepository.findById(id);
        if (admissionConditionOpt.isEmpty() || !admissionConditionOpt.get().getProgram().getId().equals(programId)) {
            return ResponseEntity.notFound().build();
        }

        AdmissionConditionResponse response = mapAdmissionCondition(admissionConditionOpt.get());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<?> createAdmissionCondition(
            @PathVariable Long programId,
            @Valid @RequestBody AdmissionConditionRequest request
    ) {
        Optional<Program> programOpt = programRepository.findById(programId);
        if (programOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOpt.get();

        // Проверяем, нет ли уже условия поступления для этого года
        boolean yearExists = program.getAdmissionConditions().stream()
                .anyMatch(ac -> ac.getYear().equals(request.year()));

        if (yearExists) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Условие поступления для " + request.year() + " года уже существует");
        }

        AdmissionCondition admissionCondition = new AdmissionCondition();
        admissionCondition.setProgram(program);
        admissionCondition.setYear(request.year());
        admissionCondition.setPassingScore(request.passingScore());
        admissionCondition.setBudgetPlaces(request.budgetPlaces());
        admissionCondition.setTargetedPlaces(request.targetedPlaces());
        admissionCondition.setPaidPlaces(request.paidPlaces());
        admissionCondition.setAdmissionFee(request.admissionFee());
        admissionCondition.setHasDvi(request.hasDvi());

        admissionCondition = admissionConditionRepository.save(admissionCondition);

        AdmissionConditionResponse response = mapAdmissionCondition(admissionCondition);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<?> updateAdmissionCondition(
            @PathVariable Long programId,
            @PathVariable Long id,
            @Valid @RequestBody AdmissionConditionRequest request
    ) {
        Optional<AdmissionCondition> admissionConditionOpt = admissionConditionRepository.findById(id);
        if (admissionConditionOpt.isEmpty() || !admissionConditionOpt.get().getProgram().getId().equals(programId)) {
            return ResponseEntity.notFound().build();
        }

        AdmissionCondition admissionCondition = admissionConditionOpt.get();

        // Проверяем, не изменяется ли год на уже существующий
        if (!admissionCondition.getYear().equals(request.year())) {
            boolean yearExists = admissionCondition.getProgram().getAdmissionConditions().stream()
                    .anyMatch(ac -> !ac.getId().equals(id) && ac.getYear().equals(request.year()));

            if (yearExists) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Условие поступления для " + request.year() + " года уже существует");
            }
        }

        admissionCondition.setYear(request.year());
        admissionCondition.setPassingScore(request.passingScore());
        admissionCondition.setBudgetPlaces(request.budgetPlaces());
        admissionCondition.setTargetedPlaces(request.targetedPlaces());
        admissionCondition.setPaidPlaces(request.paidPlaces());
        admissionCondition.setAdmissionFee(request.admissionFee());
        admissionCondition.setHasDvi(request.hasDvi());

        admissionCondition = admissionConditionRepository.save(admissionCondition);

        AdmissionConditionResponse response = mapAdmissionCondition(admissionCondition);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<Void> deleteAdmissionCondition(
            @PathVariable Long programId,
            @PathVariable Long id
    ) {
        Optional<AdmissionCondition> admissionConditionOpt = admissionConditionRepository.findById(id);
        if (admissionConditionOpt.isEmpty() || !admissionConditionOpt.get().getProgram().getId().equals(programId)) {
            return ResponseEntity.notFound().build();
        }

        admissionConditionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/copy-to-year")
    @PreAuthorize("hasAnyRole('ADMIN', 'UNIVERSITY_ADMIN', 'EDITOR')")
    public ResponseEntity<?> copyAdmissionConditionToYear(
            @PathVariable Long programId,
            @PathVariable Long id,
            @RequestBody(required = true) java.util.Map<String, Integer> body
    ) {
        Integer targetYear = body.get("targetYear");
        if (targetYear == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Не указан целевой год");
        }

        try {
            List<AdmissionConditionResponse> responses = admissionConditionService.copyAdmissionConditionToYear(programId, id, targetYear);
            // сортируем по году для предсказуемого вывода
            responses = responses.stream()
                    .sorted(java.util.Comparator.comparingInt(AdmissionConditionResponse::year))
                    .toList();
            return ResponseEntity.ok(responses);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка копирования условия: " + e.getMessage());
        }
    }

    private AdmissionConditionResponse mapAdmissionCondition(AdmissionCondition ac) {
        List<SubjectResponse> subjects = ac.getProgramSubjects().stream()
                .map(ps -> new SubjectResponse(
                        ps.getSubject().getId(),
                        ps.getSubject().getName(),
                        ps.getExamNumber(),
                        ps.getMinScore()
                ))
                .sorted(Comparator.comparing(subject -> subject.examNumber() == null ? Integer.MAX_VALUE : subject.examNumber()))
                .toList();

        return new AdmissionConditionResponse(
                ac.getId(),
                ac.getYear(),
                ac.getPassingScore(),
                ac.getBudgetPlaces(),
                ac.getTargetedPlaces(),
                ac.getPaidPlaces(),
                subjects,
                ac.getAdmissionFee(),
                ac.getHasDvi()
        );
    }
}
