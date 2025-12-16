package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.InfrastructureResponse;
import com.unidata.university_system.dto.InfrastructureTypeResponse;
import com.unidata.university_system.models.Infrastructure;
import com.unidata.university_system.models.InfrastructureType;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class InfrastructureMapper {

    public InfrastructureResponse fromEntity(Infrastructure infrastructure) {
        if (infrastructure == null) {
            return null;
        }
        return new InfrastructureResponse(
                infrastructure.getId(),
                infrastructure.getName(),
                infrastructure.getDescription(),
                infrastructure.getAddress(),
                fromType(infrastructure.getType())
        );
    }

    public InfrastructureTypeResponse fromType(InfrastructureType type) {
        if (type == null) {
            return null;
        }
        return new InfrastructureTypeResponse(
                type.getId(),
                type.getName(),
                type.getDescription()
        );
    }

    public List<InfrastructureResponse> fromEntityList(List<Infrastructure> infrastructures) {
        if (infrastructures == null || infrastructures.isEmpty()) {
            return Collections.emptyList();
        }
        return infrastructures.stream()
                .map(this::fromEntity)
                .collect(Collectors.toList());
    }
}
