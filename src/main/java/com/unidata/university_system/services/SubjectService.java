package com.unidata.university_system.services;

import com.unidata.university_system.dto.SubjectRequest;
import com.unidata.university_system.dto.SubjectResponse;
import com.unidata.university_system.mapper.SubjectMapper;
import com.unidata.university_system.models.Subject;
import com.unidata.university_system.repositories.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SubjectMapper subjectMapper;

    public List<SubjectResponse> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(subjectMapper::fromSubject)
                .collect(Collectors.toList());
    }

    public Optional<SubjectResponse> getSubjectById(Long id) {
        return subjectRepository.findById(id)
                .map(subjectMapper::fromSubject);
    }

    public SubjectResponse createSubject(SubjectRequest request) {
        Subject subject = subjectMapper.toSubject(request);
        Subject savedSubject = subjectRepository.save(subject);
        return subjectMapper.fromSubject(savedSubject);
    }

    public Optional<SubjectResponse> updateSubject(Long id, SubjectRequest request) {
        Optional<Subject> existingSubject = subjectRepository.findById(id);
        if (existingSubject.isPresent()) {
            Subject updatedSubject = subjectMapper.toSubject(request);
            updatedSubject.setId(id); // Ensure ID is preserved
            Subject savedSubject = subjectRepository.save(updatedSubject);
            return Optional.of(subjectMapper.fromSubject(savedSubject));
        }
        return Optional.empty();
    }

    public boolean deleteSubject(Long id) {
        if (subjectRepository.existsById(id)) {
            subjectRepository.deleteById(id);
            return true;
        }
        return false;
    }
}