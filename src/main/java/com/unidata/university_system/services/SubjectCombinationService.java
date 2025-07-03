package com.unidata.university_system.services;

import com.unidata.university_system.models.SubjectCombination;
import com.unidata.university_system.repositories.SubjectCombinationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SubjectCombinationService {

    @Autowired
    private SubjectCombinationRepository subjectCombinationRepository;

    public List<SubjectCombination> getAllSubjectCombinations() {
        return subjectCombinationRepository.findAll();
    }

    public Optional<SubjectCombination> getSubjectCombinationById(Long id) {
        return subjectCombinationRepository.findById(id);
    }

    public SubjectCombination createSubjectCombination(SubjectCombination subjectCombination) {
        return subjectCombinationRepository.save(subjectCombination);
    }

    public Optional<SubjectCombination> updateSubjectCombination(Long id, SubjectCombination updatedSubjectCombination) {
        Optional<SubjectCombination> existingSubjectCombination = subjectCombinationRepository.findById(id);
        if (existingSubjectCombination.isPresent()) {
            updatedSubjectCombination.setId(id);
            return Optional.of(subjectCombinationRepository.save(updatedSubjectCombination));
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