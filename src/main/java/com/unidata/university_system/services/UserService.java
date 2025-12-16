package com.unidata.university_system.services;

import com.unidata.university_system.models.*;
import com.unidata.university_system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public void addFavoriteUniversity(Long userId, Long universityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Проверяем, не добавлен ли уже этот университет
        boolean alreadyExists = user.getFavoriteUniversities().stream()
                .anyMatch(fu -> fu.getUniversityId().equals(universityId));

        if (!alreadyExists) {
            FavoriteUniversity favoriteUniversity = new FavoriteUniversity();
            favoriteUniversity.setUserId(userId);
            favoriteUniversity.setUniversityId(universityId);
            favoriteUniversity.setCreatedAt(LocalDateTime.now());
            favoriteUniversity.setUser(user);
            user.getFavoriteUniversities().add(favoriteUniversity);
            userRepository.save(user);
        }
    }

    public void removeFavoriteUniversity(Long userId, Long universityId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        System.out.println("🔍 UserService: до удаления, избранных университетов: " + user.getFavoriteUniversities().size());
        boolean removed = user.getFavoriteUniversities().removeIf(fu -> fu.getUniversityId().equals(universityId));
        System.out.println("🗑️ UserService: удалено элементов: " + (removed ? 1 : 0));
        System.out.println("🔍 UserService: после удаления, избранных университетов: " + user.getFavoriteUniversities().size());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Set<University> getFavoriteUniversities(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        
        return user.getFavoriteUniversities().stream()
                .map(FavoriteUniversity::getUniversity)
                .collect(Collectors.toSet());
    }

    public void addFavoriteProgram(Long userId, Long programId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Проверяем, не добавлена ли уже эта программа
        boolean alreadyExists = user.getFavoritePrograms().stream()
                .anyMatch(fp -> fp.getProgramId().equals(programId));

        if (!alreadyExists) {
            FavoriteProgram favoriteProgram = new FavoriteProgram();
            favoriteProgram.setUserId(userId);
            favoriteProgram.setProgramId(programId);
            favoriteProgram.setCreatedAt(LocalDateTime.now());
            favoriteProgram.setUser(user);
            user.getFavoritePrograms().add(favoriteProgram);
            userRepository.save(user);
        }
    }

    public void removeFavoriteProgram(Long userId, Long programId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        System.out.println("🔍 UserService: до удаления, избранных программ: " + user.getFavoritePrograms().size());
        boolean removed = user.getFavoritePrograms().removeIf(fp -> fp.getProgramId().equals(programId));
        System.out.println("🗑️ UserService: удалено элементов: " + (removed ? 1 : 0));
        System.out.println("🔍 UserService: после удаления, избранных программ: " + user.getFavoritePrograms().size());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<Program> getFavoritePrograms(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        
        return user.getFavoritePrograms().stream()
                .map(FavoriteProgram::getProgram)
                .collect(Collectors.toList());
    }

    // Методы для работы со специальностями удалены - теперь работаем только с университетами и программами
}