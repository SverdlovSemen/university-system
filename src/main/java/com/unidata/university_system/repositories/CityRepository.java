package com.unidata.university_system.repositories;

import com.unidata.university_system.models.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Long> {
    Optional<City> findByName(String name);

    Optional<City> findByNameIgnoreCaseAndRegionId(String name, Long regionId);
}