package com.unidata.university_system.services;

import com.unidata.university_system.dto.DisciplineResponse;
import com.unidata.university_system.models.Discipline;
import com.unidata.university_system.repositories.DisciplineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProgramService {
    private final DisciplineRepository disciplineRepository;

    public ProgramService(DisciplineRepository disciplineRepository) {
        this.disciplineRepository = disciplineRepository;
    }

    public List<DisciplineResponse> getDisciplinesForProgram(Long programId) {
        List<Discipline> disciplines = disciplineRepository.findByProgramIdOrderBySemesterAsc(programId);
        return disciplines.stream()
                .map(d -> new DisciplineResponse(d.getId(), d.getName(), d.getSemester(), d.getTotalHours()))
                .toList();
    }
}

