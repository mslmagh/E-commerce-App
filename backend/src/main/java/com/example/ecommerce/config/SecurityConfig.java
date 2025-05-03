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
            // Disable CSRF (common for stateless APIs)
            .csrf(AbstractHttpConfigurer::disable)
            // === Configure Session Management to STATELESS ===
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // === Configure Authorization Rules ===
            .authorizeHttpRequests(authorize -> authorize
                // Permit access to authentication endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // Permit access to Swagger UI and API docs (if not using WebSecurityCustomizer)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Permit access to status endpoint
                .requestMatchers("/api/status").permitAll()
                // Permit GET requests for products (adjust as needed)
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                // Require authentication for all other requests
                .anyRequest().authenticated()
            );

        // Register the custom AuthenticationProvider
        http.authenticationProvider(authenticationProvider());

        // Add the custom JWT filter before the standard UsernamePasswordAuthenticationFilter
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        // Remove HttpBasic and FormLogin as JWT filter handles authentication
        // http.httpBasic(withDefaults());
        // http.formLogin(withDefaults());

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