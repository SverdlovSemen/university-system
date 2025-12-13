package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.UserRequest;
import com.unidata.university_system.dto.UserResponse;
import com.unidata.university_system.models.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserMapper {

    public User toUser(UserRequest request) {
        if (request == null) return null;
        User user = new User();
        user.setId(request.id());
        user.setEmail(request.email());
        user.setPassword(request.password());
        user.setFirstName(request.firstName());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    public UserResponse fromUser(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getStatus() != null ? user.getStatus().getName() : null,
                user.isEnabled()
        );
    }

    public List<UserResponse> fromUserList(List<User> users) {
        if (users == null) return Collections.emptyList();
        return users.stream()
                .map(this::fromUser)
                .collect(Collectors.toList());
    }
}