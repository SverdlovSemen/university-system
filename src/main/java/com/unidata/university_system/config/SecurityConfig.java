package com.unidata.university_system.config;

import com.unidata.university_system.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import javax.sql.DataSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private DataSource dataSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .mvcMatchers("/api/v1/users/login").permitAll()              // Логин публично доступен
                        .mvcMatchers("/api/v1/universities/**").hasAnyRole("EDITOR", "ADMIN") // Университеты только для редакторов и администраторов
                        .mvcMatchers("/api/v1/admin/**").hasRole("ADMIN")           // Панель администратора доступна только администратору
                        .anyRequest().authenticated()                               // Любые другие запросы требуют авторизации
                )
                .formLogin()                                                        // Включаем форму входа
                .httpBasic()                                                       // Поддерживаем HTTP basic аутентификацию
                .csrf().disable();                                                  // Пока отключаем CSRF (для упрощения тестирования)
        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.jdbcAuthentication()
                .dataSource(dataSource)
                .withDefaultSchema()
                .passwordEncoder(passwordEncoder())
                .usersByUsernameQuery("SELECT username, password, enabled FROM users WHERE username=?")
                .authoritiesByUsernameQuery("SELECT u.username, r.role_name FROM users u INNER JOIN user_roles ur ON(u.id=ur.user_id) INNER JOIN roles r ON(r.id=ur.role_id) WHERE u.username=?");
    }
}