package com.unidata.university_system.services;

import com.unidata.university_system.dto.InfrastructureResponse;
import com.unidata.university_system.mapper.InfrastructureMapper;
import com.unidata.university_system.repositories.InfrastructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InfrastructureService {

    private final InfrastructureRepository infrastructureRepository;
    private final InfrastructureMapper infrastructureMapper;

    public List<InfrastructureResponse> getInfrastructureByUniversity(Long universityId) {
        return infrastructureMapper.fromEntityList(
                infrastructureRepository.findAllByUniversityId(universityId)
        );
    }
}
