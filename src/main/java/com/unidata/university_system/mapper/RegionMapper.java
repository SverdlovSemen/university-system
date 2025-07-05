package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.RegionRequest;
import com.unidata.university_system.dto.RegionResponse;
import com.unidata.university_system.models.Region;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RegionMapper {

    public Region toRegion(RegionRequest request) {
        if (request == null) return null;
        Region region = new Region();
        region.setId(request.id());
        region.setName(request.name());
        return region;
    }

    public RegionResponse fromRegion(Region region) {
        if (region == null) return null;
        return new RegionResponse(
                region.getId(),
                region.getName()
        );
    }

    public List<RegionResponse> fromRegionList(List<Region> regions) {
        if (regions == null) return Collections.emptyList();
        return regions.stream()
                .map(this::fromRegion)
                .collect(Collectors.toList());
    }
}