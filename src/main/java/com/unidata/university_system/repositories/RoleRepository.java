package com.unidata.university_system.repositories;

import com.unidata.university_system.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    // Поиск роли по названию (например, "ROLE_ADMIN")
    Optional<Role> findByRoleName(String roleName);
}