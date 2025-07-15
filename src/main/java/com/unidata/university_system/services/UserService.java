package com.unidata.university_system.services;

import com.unidata.university_system.models.Specialty;
import com.unidata.university_system.models.University;
import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public void addFavoriteUniversity(Long userId, Long universityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        University university = new University();
        university.setId(universityId);

        user.getFavoriteUniversities().add(university);
        userRepository.save(user);
    }

    public void removeFavoriteUniversity(Long userId, Long universityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.getFavoriteUniversities().removeIf(u -> u.getId().equals(universityId));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Set<University> getFavoriteUniversities(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId))
                .getFavoriteUniversities();
    }

    public void addFavoriteSpecialty(Long userId, Long specialtyId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Specialty specialty = new Specialty();
        specialty.setId(specialtyId);

        user.getFavoriteSpecialties().add(specialty);
        userRepository.save(user);
    }

    public void removeFavoriteSpecialty(Long userId, Long specialtyId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.getFavoriteSpecialties().removeIf(s -> s.getId().equals(specialtyId));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Set<Specialty> getFavoriteSpecialties(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId))
                .getFavoriteSpecialties();
    }
}