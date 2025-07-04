package com.unidata.university_system.repositories;

import com.unidata.university_system.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Поиск пользователя по имени пользователя (логину)
    Optional<User> findByUsername(String username);

    // Проверка существования пользователя с заданным именем
    boolean existsByUsername(String username);
}