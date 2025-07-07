package com.unidata.university_system.services;

import com.opencsv.bean.CsvToBean;
import com.opencsv.bean.CsvToBeanBuilder;
import com.unidata.university_system.models.RequiredSubject;
import com.unidata.university_system.dto.csv.RequiredSubjectCsvDTO;
import com.unidata.university_system.models.RequiredSubjectId;
import com.unidata.university_system.models.Subject;
import com.unidata.university_system.models.SubjectCombination;
import com.unidata.university_system.repositories.RequiredSubjectRepository;
import com.unidata.university_system.repositories.SubjectCombinationRepository;
import com.unidata.university_system.repositories.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

@Service
public class RequiredSubjectService {

    @Autowired
    private RequiredSubjectRepository requiredSubjectRepository;

    @Autowired
    private SubjectCombinationRepository subjectCombinationRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Transactional
    public List<RequiredSubject> importRequiredSubjects(MultipartFile file) throws Exception {
        List<RequiredSubject> savedRequiredSubjects = new ArrayList<>();
        try (Reader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            CsvToBean<RequiredSubjectCsvDTO> csvToBean = new CsvToBeanBuilder<RequiredSubjectCsvDTO>(reader)
                    .withType(RequiredSubjectCsvDTO.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build();

            for (RequiredSubjectCsvDTO dto : csvToBean) {
                // Validate dependencies
                SubjectCombination combination = subjectCombinationRepository.findById(dto.getCombinationId())
                        .orElseThrow(() -> new IllegalArgumentException("SubjectCombination with ID " + dto.getCombinationId() + " not found"));
                Subject subject = subjectRepository.findById(dto.getSubjectId())
                        .orElseThrow(() -> new IllegalArgumentException("Subject with ID " + dto.getSubjectId() + " not found"));

                // Check if the record already exists
                RequiredSubjectId id = new RequiredSubjectId(dto.getCombinationId(), dto.getSubjectId());
                if (!requiredSubjectRepository.existsById(id)) {
                    RequiredSubject requiredSubject = new RequiredSubject();
                    requiredSubject.setCombinationId(dto.getCombinationId());
                    requiredSubject.setSubjectId(dto.getSubjectId());
                    requiredSubject.setSubjectCombination(combination);
                    requiredSubject.setSubject(subject);
                    savedRequiredSubjects.add(requiredSubjectRepository.save(requiredSubject));
                }
            }
        } catch (Exception e) {
            throw new Exception("Failed to process required subjects CSV: " + e.getMessage(), e);
        }
        return savedRequiredSubjects;
    }
}