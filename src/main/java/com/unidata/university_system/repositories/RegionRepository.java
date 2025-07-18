package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {
    Optional<Region> findByName(String name);

    Optional<Region> findByNameIgnoreCase(String name);
}