package com.example.ecommerce.controller;

import com.example.ecommerce.dto.JwtResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.SignupRequest;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException; // For role not found
import com.example.ecommerce.repository.RoleRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.security.jwt.JwtUtils; // Your JWT utility class
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication API", description = "API endpoints for user login and registration")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Operation(summary = "Authenticate User", description = "Logs in a user and returns a JWT token.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful, JWT token returned"),
        @ApiResponse(responseCode = "400", description = "Invalid request body"),
        @ApiResponse(responseCode = "401", description = "Invalid username or password")
    })
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        // Perform authentication using Spring Security's AuthenticationManager
        // This will use UserDetailsServiceImpl and PasswordEncoder configured earlier
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // Set the authentication object in the security context
        SecurityContextHolder.getContext().setAuthentication(authentication);
        // Generate the JWT token
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Get UserDetails (our User entity) from the authentication object
        User userDetails = (User) authentication.getPrincipal();
        // Get roles as a list of strings
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Return the JWT response DTO
        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(),
                                                 userDetails.getUsername(),
                                                 userDetails.getEmail(),
                                                 roles));
    }

    @Operation(summary = "Register New User", description = "Creates a new user account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body or username/email already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // Check if username is already taken
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Username is already taken!");
        }

        // Check if email is already taken (if email is provided and unique constraint exists)
        if (signUpRequest.getEmail() != null && !signUpRequest.getEmail().isEmpty() && userRepository.existsByEmail(signUpRequest.getEmail())) {
             // Note: existsByEmail needs to be added to UserRepository interface
             // If you don't have an email field or unique constraint, remove this check.
             return ResponseEntity
                     .badRequest()
                     .body("Error: Email is already in use!");
        }


        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail()); // Set email if provided
        user.setPassword(encoder.encode(signUpRequest.getPassword())); // Encode password
        user.setEnabled(true); // Enable the user by default

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            // Assign default role "ROLE_USER" if no roles are specified
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Error: Default role ROLE_USER is not found in database."));
            roles.add(userRole);
        } else {
            // Process roles requested in the signup request
            strRoles.forEach(roleName -> {
                // Simplified role handling: Find role by name, add if exists.
                // Add more robust handling (e.g., based on ENUMs, checking allowed roles) as needed.
                Role foundRole = roleRepository.findByName(roleName.toUpperCase()) // Ensure case consistency if needed
                        .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " is not found."));
                roles.add(foundRole);
            });
        }

        user.setRoles(roles); // Set the roles for the user
        userRepository.save(user); // Save the user to the database

        // Return success response
        return ResponseEntity.ok("User registered successfully!");
    }
}