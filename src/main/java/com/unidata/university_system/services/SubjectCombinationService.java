package com.unidata.university_system.services;

import com.unidata.university_system.dto.SubjectCombinationRequest;
import com.unidata.university_system.dto.SubjectCombinationResponse;
import com.unidata.university_system.mapper.SubjectCombinationMapper;
import com.unidata.university_system.models.SubjectCombination;
import com.unidata.university_system.repositories.SubjectCombinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubjectCombinationService {

    @Autowired
    private SubjectCombinationRepository subjectCombinationRepository;

    @Autowired
    private SubjectCombinationMapper subjectCombinationMapper;

    public List<SubjectCombinationResponse> getAllSubjectCombinations() {
        return subjectCombinationRepository.findAll().stream()
                .map(subjectCombinationMapper::fromSubjectCombination)
                .collect(Collectors.toList());
    }

    public Optional<SubjectCombinationResponse> getSubjectCombinationById(Long id) {
        return subjectCombinationRepository.findById(id)
                .map(subjectCombinationMapper::fromSubjectCombination);
    }

    public SubjectCombinationResponse createSubjectCombination(SubjectCombinationRequest request) {
        SubjectCombination subjectCombination = subjectCombinationMapper.toSubjectCombination(request);
        SubjectCombination savedSubjectCombination = subjectCombinationRepository.save(subjectCombination);
        return subjectCombinationMapper.fromSubjectCombination(savedSubjectCombination);
    }

    public Optional<SubjectCombinationResponse> updateSubjectCombination(Long id, SubjectCombinationRequest request) {
        Optional<SubjectCombination> existingSubjectCombination = subjectCombinationRepository.findById(id);
        if (existingSubjectCombination.isPresent()) {
            SubjectCombination updatedSubjectCombination = subjectCombinationMapper.toSubjectCombination(request);
            updatedSubjectCombination.setId(id); // Ensure ID is preserved
            SubjectCombination savedSubjectCombination = subjectCombinationRepository.save(updatedSubjectCombination);
            return Optional.of(subjectCombinationMapper.fromSubjectCombination(savedSubjectCombination));
        }
        return Optional.empty();
    }

    public boolean deleteSubjectCombination(Long id) {
        if (subjectCombinationRepository.existsById(id)) {
            subjectCombinationRepository.deleteById(id);
            return true;
        }
        return false;
    }
}