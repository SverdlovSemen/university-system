package com.unidata.university_system.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unidata.university_system.models.*;
import com.unidata.university_system.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
public class UniversityImportService {
    @Autowired
    private UniversityRepository universityRepository;
    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private SpecialtyRepository specialtyRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private SubjectCombinationRepository subjectCombinationRepository;
    @Autowired
    private CityRepository cityRepository;
    @Autowired
    private RegionRepository regionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void importFromJson(MultipartFile file, String mode) throws IOException {
        JsonNode root = objectMapper.readTree(file.getInputStream());
        if (!root.isArray()) {
            throw new IllegalArgumentException("JSON root must be an array of universities");
        }
        if ("replace".equalsIgnoreCase(mode)) {
            // Очистка всех связанных таблиц
            subjectCombinationRepository.deleteAllInBatch();
            specialtyRepository.deleteAllInBatch();
            facultyRepository.deleteAllInBatch();
            universityRepository.deleteAllInBatch();
            cityRepository.deleteAllInBatch();
            regionRepository.deleteAllInBatch();
            subjectRepository.deleteAllInBatch();
        }
        for (JsonNode uniNode : root) {
            processUniversityNode(uniNode);
        }
    }

    private void processUniversityNode(JsonNode uniNode) {
        // Валидация
        if (!uniNode.hasNonNull("name") || !uniNode.hasNonNull("type") || !uniNode.hasNonNull("city")) {
            throw new IllegalArgumentException("University must have name, type, and city");
        }
        // Регион и город
        String regionName = uniNode.path("city").path("region").asText(null);
        if (regionName == null) throw new IllegalArgumentException("City must have region");
        Region region = regionRepository.findByName(regionName).orElseGet(() -> regionRepository.save(new Region(regionName)));
        String cityName = uniNode.path("city").path("name").asText();
        City city = cityRepository.findByName(cityName).orElseGet(() -> cityRepository.save(new City(cityName, region)));
        // Университет
        University university = new University();
        university.setName(uniNode.get("name").asText());
        university.setType(uniNode.get("type").asText());
        university.setAvgEgeScore(uniNode.has("avgEgeScore") ? uniNode.get("avgEgeScore").asDouble() : null);
        university.setCountryRanking(uniNode.has("countryRanking") ? uniNode.get("countryRanking").asInt() : null);
        university.setCity(city);
        university = universityRepository.save(university);
        // Факультеты
        if (uniNode.has("faculties")) {
            for (JsonNode facNode : uniNode.get("faculties")) {
                Faculty faculty = new Faculty();
                faculty.setName(facNode.get("name").asText());
                faculty.setUniversity(university);
                faculty = facultyRepository.save(faculty);
                // Специальности
                if (facNode.has("specialties")) {
                    for (JsonNode specNode : facNode.get("specialties")) {
                        Specialty specialty = new Specialty();
                        specialty.setName(specNode.get("name").asText());
                        specialty.setProgramCode(specNode.get("programCode").asText());
                        specialty.setDescription(specNode.has("description") ? specNode.get("description").asText() : null);
                        specialty.setFaculty(faculty);
                        specialty = specialtyRepository.save(specialty);
                        // Комбинации предметов
                        if (specNode.has("subjectCombinations")) {
                            for (JsonNode combNode : specNode.get("subjectCombinations")) {
                                SubjectCombination combination = new SubjectCombination();
                                combination.setSpecialty(specialty);
                                combination = subjectCombinationRepository.save(combination);
                                // Требуемые предметы
                                if (combNode.has("subjects")) {
                                    for (JsonNode subjNode : combNode.get("subjects")) {
                                        String subjName = subjNode.asText();
                                        Subject subject = subjectRepository.findByName(subjName).orElseGet(() -> subjectRepository.save(new Subject(subjName)));
                                        combination.getSubjects().add(subject);
                                    }
                                    subjectCombinationRepository.save(combination);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
