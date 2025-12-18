package com.unidata.university_system.services;

import com.unidata.university_system.dto.AdmissionConditionResponse;
import com.unidata.university_system.models.AdmissionCondition;
import com.unidata.university_system.repositories.AdmissionConditionRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdmissionConditionService {

    private final AdmissionConditionRepository admissionConditionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public AdmissionConditionService(AdmissionConditionRepository admissionConditionRepository) {
        this.admissionConditionRepository = admissionConditionRepository;
    }

    @Transactional
    public List<AdmissionConditionResponse> copyAdmissionConditionToYear(Long programId, Long sourceConditionId, Integer targetYear) {
        Optional<AdmissionCondition> sourceOpt = admissionConditionRepository.findById(sourceConditionId);
        if (sourceOpt.isEmpty() || !sourceOpt.get().getProgram().getId().equals(programId)) {
            throw new IllegalArgumentException("Условие поступления не найдено для указанной программы");
        }

        if (admissionConditionRepository.findByProgramIdAndYear(programId, targetYear).isPresent()) {
            throw new IllegalArgumentException("Условия поступления для указанного года уже существуют");
        }

        // Вызов хранимой процедуры copy_admission_conditions_to_year(p_source_condition_id, p_target_year)
        entityManager.createNativeQuery("CALL copy_admission_conditions_to_year(:sourceId, :targetYear)")
                .setParameter("sourceId", sourceConditionId.intValue())
                .setParameter("targetYear", targetYear)
                .executeUpdate();

        // Возвращаем обновленный список условий для программы
        List<AdmissionCondition> conditions = admissionConditionRepository.findAll().stream()
                .filter(ac -> ac.getProgram().getId().equals(programId))
                .toList();

        return conditions.stream()
                .map(ac -> new AdmissionConditionResponse(
                        ac.getId(),
                        ac.getYear(),
                        ac.getPassingScore(),
                        ac.getBudgetPlaces(),
                        ac.getTargetedPlaces(),
                        ac.getPaidPlaces(),
                        ac.getProgramSubjects().stream()
                                .map(ps -> new com.unidata.university_system.dto.SubjectResponse(
                                        ps.getSubject().getId(),
                                        ps.getSubject().getName(),
                                        ps.getExamNumber(),
                                        ps.getMinScore()
                                ))
                                .toList(),
                        ac.getAdmissionFee(),
                        ac.getHasDvi()
                ))
                .toList();
    }
}

