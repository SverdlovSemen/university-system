package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.SubjectRequest;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.models.Subject;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectMapper {

    public Subject toSubject(SubjectRequest request) {
        if (request == null) return null;
        Subject subject = new Subject();
        subject.setId(request.id());
        subject.setName(request.name());
        return subject;
    }

    public SubjectResponse fromSubject(Subject subject) {
        if (subject == null) return null;
        return new SubjectResponse(
                subject.getId(),
                subject.getName()
        );
    }

    public List<SubjectResponse> fromSubjectList(List<Subject> subjects) {
        if (subjects == null) return Collections.emptyList();
        return subjects.stream()
                .map(this::fromSubject)
                .collect(Collectors.toList());
    }
}