package com.unidata.university_system.repositories;

import com.unidata.university_system.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Поиск пользователя по email
    Optional<User> findByEmail(String email);

    // Проверка существования пользователя с заданным email
    boolean existsByEmail(String email);

    // Для обратной совместимости со Spring Security (UserDetailsService использует username)
    default Optional<User> findByUsername(String username) {
        return findByEmail(username);
    }

    default boolean existsByUsername(String username) {
        return existsByEmail(username);
    }
}