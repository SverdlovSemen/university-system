package com.unidata.university_system.services;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.mapper.SubjectCombinationMapper;
import com.unidata.university_system.models.SpecializationSubject;
import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.Subject;
import com.unidata.university_system.repositories.SpecializationSubjectRepository;
import com.unidata.university_system.repositories.SpecialtyRepository;
import com.unidata.university_system.repositories.SubjectRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SubjectCombinationService {

    @Autowired
    private SpecializationSubjectRepository specializationSubjectRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SubjectCombinationMapper subjectCombinationMapper;

    public List<SubjectCombinationResponse> getSubjectCombinationsBySpecialtyId(Long specialtyId) {
        Set<SpecializationSubject> subjects = specializationSubjectRepository.findBySpecializationId(specialtyId)
                .stream()
                .collect(Collectors.toSet());
        return subjectCombinationMapper.fromSpecializationSubjects(specialtyId, subjects);
    }

    @Transactional
    public List<SubjectCombinationResponse> replaceSubjects(Long specialtyId, List<SubjectCombinationRequest> requests) {
        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new IllegalArgumentException("Specialty with ID " + specialtyId + " not found"));

        specializationSubjectRepository.deleteBySpecializationId(specialtyId);

        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

        // Объединяем все переданные предметы в один набор
        Set<Long> subjectIds = requests.stream()
                .filter(req -> req.subjects() != null)
                .flatMap(req -> req.subjects().stream())
                .map(subject -> subject.id())
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        List<SpecializationSubject> saved = subjectIds.stream().map(subjectId -> {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new IllegalArgumentException("Subject with ID " + subjectId + " not found"));
            SpecializationSubject entity = new SpecializationSubject();
            entity.setSpecializationId(specialtyId);
            entity.setSubjectId(subjectId);
            entity.setSpecialization(specialty);
            entity.setSubject(subject);
            entity.setIsRequired(true);
            return specializationSubjectRepository.save(entity);
        }).toList();

        return subjectCombinationMapper.fromSpecializationSubjects(
                specialtyId,
                saved.stream().collect(Collectors.toSet())
        );
    }
}