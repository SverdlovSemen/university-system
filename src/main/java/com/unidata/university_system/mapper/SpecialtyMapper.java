package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.SpecialtyRequest;
import com.unidata.university_system.dto.SpecialtyResponse;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.EducationLevel;
import com.unidata.university_system.models.SpecializationSubject;
import com.unidata.university_system.models.Specialty;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SpecialtyMapper {

    public Specialty toSpecialty(SpecialtyRequest request) {
        if (request == null) return null;

        Specialty specialty = new Specialty();
        specialty.setId(request.id());
        specialty.setName(request.name());
        specialty.setProgramCode(request.programCode());
        specialty.setDescription(request.description() != null ? request.description() : "");

        if (request.educationLevelId() != null) {
            EducationLevel level = new EducationLevel();
            level.setId(request.educationLevelId());
            specialty.setEducationLevel(level);
        }

        return specialty;
    }

    public SpecialtyResponse fromSpecialty(
            Specialty specialty,
            List<Long> facultyIds,
            List<SubjectCombinationResponse> subjectCombinations
    ) {
        if (specialty == null) return null;

        return new SpecialtyResponse(
                specialty.getId(),
                specialty.getName(),
                specialty.getProgramCode(),
                specialty.getDescription(),
                facultyIds == null ? Collections.emptyList() : facultyIds,
                subjectCombinations == null ? Collections.emptyList() : subjectCombinations,
                specialty.getEducationLevel() != null ? specialty.getEducationLevel().getName() : null // Correctly map education level
        );
    }

    public List<SubjectCombinationResponse> toSubjectCombinationResponses(Set<SpecializationSubject> specializationSubjects) {
        if (specializationSubjects == null || specializationSubjects.isEmpty()) {
            return Collections.emptyList();
        }

        List<SubjectResponse> subjects = specializationSubjects.stream()
                .map(SpecializationSubject::getSubject)
                .filter(subject -> subject != null)
                .map(subject -> new SubjectResponse(subject.getId(), subject.getName(), null, null))
                .toList();

        SubjectCombinationResponse combination = new SubjectCombinationResponse(
                null,
                specializationSubjects.iterator().next().getSpecializationId(),
                subjects
        );

        return List.of(combination);
    }

    public List<SpecialtyResponse> fromSpecialtyList(
            List<Specialty> specialties,
            java.util.function.Function<Specialty, List<SubjectCombinationResponse>> subjectsProvider
    ) {
        if (specialties == null) return Collections.emptyList();
        return specialties.stream()
                .map(spec -> fromSpecialty(spec, Collections.emptyList(), subjectsProvider.apply(spec)))
                .collect(Collectors.toList());
    }
}