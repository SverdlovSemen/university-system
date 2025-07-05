package com.unidata.university_system.mapper;

import com.unidata.university_system.dto.RoleRequest;
import com.unidata.university_system.dto.RoleResponse;
import com.unidata.university_system.models.Role;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleMapper {

    public Role toRole(RoleRequest request) {
        if (request == null) return null;
        Role role = new Role();
        role.setId(request.id());
        role.setRoleName(request.roleName());
        return role;
    }

    public RoleResponse fromRole(Role role) {
        if (role == null) return null;
        return new RoleResponse(
                role.getId(),
                role.getRoleName()
        );
    }

    public List<RoleResponse> fromRoleList(List<Role> roles) {
        if (roles == null) return Collections.emptyList();
        return roles.stream()
                .map(this::fromRole)
                .collect(Collectors.toList());
    }

    public Set<RoleResponse> fromRoleSet(Set<Role> roles) {
        if (roles == null) return Collections.emptySet();
        return roles.stream()
                .map(this::fromRole)
                .collect(Collectors.toSet());
    }
}