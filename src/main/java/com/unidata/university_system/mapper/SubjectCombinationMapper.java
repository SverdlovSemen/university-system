package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.models.SubjectCombination;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectCombinationMapper {

    @Autowired
    private SubjectMapper subjectMapper;

    public SubjectCombination toSubjectCombination(SubjectCombinationRequest request) {
        if (request == null) return null;
        SubjectCombination combination = new SubjectCombination();
        combination.setId(request.id());
        // Не маппим specialty, чтобы избежать рекурсии при создании
        combination.setSubjects(request.subjects() != null ?
                request.subjects().stream()
                        .map(subjectMapper::toSubject)
                        .collect(Collectors.toList()) : Collections.emptyList());
        return combination;
    }

    public SubjectCombinationResponse fromSubjectCombination(SubjectCombination combination) {
        if (combination == null) return null;
        return new SubjectCombinationResponse(
                combination.getId(),
                null, // Избегаем рекурсии, не включаем specialty
                combination.getSubjects() != null ?
                        combination.getSubjects().stream()
                                .map(subjectMapper::fromSubject)
                                .collect(Collectors.toList()) : null
        );
    }

    public List<SubjectCombinationResponse> fromSubjectCombinationList(List<SubjectCombination> combinations) {
        if (combinations == null) return Collections.emptyList();
        return combinations.stream()
                .map(this::fromSubjectCombination)
                .collect(Collectors.toList());
    }
}