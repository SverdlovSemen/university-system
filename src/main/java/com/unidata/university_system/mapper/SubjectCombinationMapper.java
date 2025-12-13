package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.SpecializationSubject;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SubjectCombinationMapper {

    public List<SubjectCombinationResponse> fromSpecializationSubjects(
            Long specializationId,
            Set<SpecializationSubject> specializationSubjects
    ) {
        if (specializationSubjects == null || specializationSubjects.isEmpty()) {
            return Collections.emptyList();
        }

        List<SubjectResponse> subjects = specializationSubjects.stream()
                .map(SpecializationSubject::getSubject)
                .filter(subject -> subject != null)
                .map(subject -> new SubjectResponse(subject.getId(), subject.getName()))
                .collect(Collectors.toList());

        return List.of(new SubjectCombinationResponse(
                null,
                specializationId,
                subjects
        ));
    }
}
