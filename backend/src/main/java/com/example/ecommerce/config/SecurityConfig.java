package com.example.ecommerce.config;

import com.example.ecommerce.security.jwt.AuthEntryPointJwt;
import com.example.ecommerce.security.jwt.AuthTokenFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Import HttpMethod
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enable @PreAuthorize etc.
public class SecurityConfig {

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless API
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler)) // Handle auth errors
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Stateless sessions
            .authorizeHttpRequests(authorize -> authorize
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll() // Auth endpoints
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll() // Allow viewing products
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll() // Allow viewing categories
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll() // Swagger UI

                // Authenticated endpoints (Specific rules handled by @PreAuthorize mostly)
                .requestMatchers("/api/products/**").authenticated() // Product creation/update/delete requires auth
                .requestMatchers("/api/categories/**").authenticated() // Category management requires auth (likely ADMIN)
                .requestMatchers("/api/cart/**").authenticated() // Cart operations require auth
                .requestMatchers("/api/my-addresses/**").authenticated() // Address management requires auth

                // ===> YENİ KURAL: Sipariş iptali için <===
                .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").authenticated() // Cancellation requires auth

                // Diğer sipariş işlemleri (GET, POST /api/orders, PATCH /status)
                .requestMatchers("/api/orders/**").authenticated() // General order access requires auth


                // Default deny all other requests unless specified
                .anyRequest().authenticated()
            )
            .addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class); // Add JWT filter

        return http.build();
    }
}