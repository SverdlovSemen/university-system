package com.unidata.university_system.services;

import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Ищем пользователя по EMAIL (а не по username)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Преобразуем роль в GrantedAuthority
        // получаем имя роли из БД (должно быть "ROLE_USER" или "ROLE_ADMIN" после миграции)
        String roleName = user.getRole() != null ? user.getRole().getName() : "ROLE_USER";

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(roleName)
        );

        // Возвращаем UserDetails с email в качестве username
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),  // username = email
                user.getPassword(),
                authorities
        );
    }
}