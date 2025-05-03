package com.example.ecommerce.config;

import com.example.ecommerce.security.jwt.AuthTokenFilter; // Import the filter
import com.example.ecommerce.service.UserDetailsServiceImpl; // Import your UserDetailsService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider; // Import DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; // Optional: for @PreAuthorize etc.
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy; // Import SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // Import filter position marker

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Optional: Enables method-level security like @PreAuthorize
public class SecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService; // Inject your UserDetailsService

    // Define the AuthTokenFilter as a Bean
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    // Define the AuthenticationProvider Bean
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService); // Set your UserDetailsService
        authProvider.setPasswordEncoder(passwordEncoder()); // Set your PasswordEncoder
        return authProvider;
    }

    // Expose AuthenticationManager Bean (already added)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Define PasswordEncoder Bean (already added)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Configure HttpSecurity - THIS IS THE MAIN PART
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                // ===> YENİ KATEGORİ İZİNLERİ <===
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll() // Allow anyone to GET categories
                .requestMatchers(HttpMethod.POST, "/api/categories").hasAnyRole("ADMIN", "SELLER") // Allow ADMIN or SELLER to POST
                // Add rules for PUT/DELETE /api/categories/{id} later if implemented (likely ADMIN only)
                // ===> YENİ KATEGORİ İZİNLERİ SONU <===
                .anyRequest().authenticated()); // Secure everything else
            // ... (csrf, sessionManagement, authenticationProvider, addFilterBefore same) ...
        return http.build();
    }

    // REMOVE the WebSecurityCustomizer bean if you still have it
    /*
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**");
    }
    */
}