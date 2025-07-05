package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.UserRequest;
import com.unidata.university_system.dto.UserResponse;
import com.unidata.university_system.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserMapper {

    @Autowired
    private RoleMapper roleMapper;

    public User toUser(UserRequest request) {
        if (request == null) return null;
        User user = new User();
        user.setId(request.id());
        user.setUsername(request.username());
        user.setPassword(request.password());
        user.setEnabled(request.enabled());
        user.setRoles(request.roles() != null ?
                request.roles().stream()
                        .map(roleMapper::toRole)
                        .collect(Collectors.toSet()) : Collections.emptySet());
        return user;
    }

    public UserResponse fromUser(User user) {
        if (user == null) return null;
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.isEnabled(),
                user.getRoles() != null ?
                        user.getRoles().stream()
                                .map(roleMapper::fromRole)
                                .collect(Collectors.toSet()) : null
        );
    }

    public List<UserResponse> fromUserList(List<User> users) {
        if (users == null) return Collections.emptyList();
        return users.stream()
                .map(this::fromUser)
                .collect(Collectors.toList());
    }
}