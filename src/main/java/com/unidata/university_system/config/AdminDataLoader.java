package com.unidata.university_system.config;

import com.unidata.university_system.models.Role;
import com.unidata.university_system.models.User;
import com.unidata.university_system.models.UserStatus;
import com.unidata.university_system.repositories.RoleRepository;
import com.unidata.university_system.repositories.UserRepository;
import com.unidata.university_system.repositories.UserStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Order(1)
public class AdminDataLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminDataLoader.class);

    private final RoleRepository roleRepository;
    private final UserStatusRepository userStatusRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminDataLoader(RoleRepository roleRepository,
                           UserStatusRepository userStatusRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userStatusRepository = userStatusRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Ensure roles exist
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_ADMIN");
                    r.setDescription("Site administrator");
                    r.setPermissions("ALL");
                    return roleRepository.save(r);
                });

        roleRepository.findByName("ROLE_UNIVERSITY_ADMIN")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_UNIVERSITY_ADMIN");
                    r.setDescription("University administrator");
                    r.setPermissions("UNIVERSITY_MANAGE");
                    return roleRepository.save(r);
                });

        roleRepository.findByName("ROLE_EDITOR")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ROLE_EDITOR");
                    r.setDescription("University editor");
                    r.setPermissions("UNIVERSITY_EDIT");
                    return roleRepository.save(r);
                });

        // Ensure ACTIVE status exists
        UserStatus activeStatus = userStatusRepository.findByName("ACTIVE")
                .orElseGet(() -> {
                    UserStatus s = new UserStatus();
                    s.setName("ACTIVE");
                    s.setDescription("Active user");
                    return userStatusRepository.save(s);
                });

        // Create site admin user if missing
        String adminEmail = "admin@example.com";
        String adminPassword = "Admin123!"; // change after first login

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setFirstName("Site Admin");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(adminRole);
            admin.setStatus(activeStatus);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            logger.info("Created default site admin: {} / {}", adminEmail, adminPassword);
        } else {
            logger.info("Site admin already exists: {}", adminEmail);
        }
    }
}
