package com.unidata.university_system.config;

import com.unidata.university_system.filters.JwtAuthFilter;
import com.unidata.university_system.services.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final LogoutHandler logoutHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless API
                .csrf(AbstractHttpConfigurer::disable)

                // CORS configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no authentication required)
                        .requestMatchers(HttpMethod.GET, "/api/universities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/faculties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/specialties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/subjects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/subject-combinations/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/regions/**").permitAll()
                        .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ROLE_USER endpoints
                        .requestMatchers(HttpMethod.GET, "/api/universities/analytics/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/assistant/query").hasRole("USER")

                        // ROLE_ADMIN endpoints
                        .requestMatchers(HttpMethod.POST, "/api/universities").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/universities/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/universities/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/universities/import").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/faculties").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/faculties/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/faculties/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/specialties").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/specialties/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/specialties/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/subjects").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/subjects/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/subjects/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/subject-combinations").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/subject-combinations/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/subject-combinations/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/cities").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/cities/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/cities/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/regions").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/regions/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/regions/{id}").hasRole("ADMIN")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                )

                // Stateless session management
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Authentication provider
                .authenticationProvider(authenticationProvider())

                // Add JWT filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

                // Logout configuration
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .addLogoutHandler(logoutHandler)
                        .logoutSuccessHandler((request, response, authentication) ->
                                SecurityContextHolder.clearContext()
                        )
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Collections.singletonList("*"));
        configuration.setExposedHeaders(Collections.singletonList("Authorization"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}