package com.example.ecommerce.controller;

import com.example.ecommerce.dto.JwtResponse;
import com.example.ecommerce.dto.LoginRequest;
import com.example.ecommerce.dto.SignupRequest;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
// import com.example.ecommerce.exception.ResourceNotFoundException; // Not needed directly here now
import com.example.ecommerce.repository.RoleRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.security.jwt.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.util.StringUtils; // Import StringUtils
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication API", description = "API endpoints for user login and registration")
public class AuthController {

    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtils jwtUtils;

    @Operation(summary = "Authenticate User")
    @ApiResponses(value = { /*...*/ })
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User userDetails = (User) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(),
                                                 userDetails.getUsername(),
                                                 userDetails.getEmail(),
                                                 roles));
    }

    @Operation(summary = "Register New User", description = "Creates a new user account with a single role (defaults to USER).")
    @ApiResponses(value = { /*...*/ })
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) { // Takes updated SignupRequest
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        if (signUpRequest.getEmail() != null && !signUpRequest.getEmail().isEmpty() && userRepository.existsByEmail(signUpRequest.getEmail())) {
             return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setEnabled(true);

        // ===> DEĞİŞEN ROL ATAMA MANTIĞI <===
        String strRole = signUpRequest.getRole(); // Get single role string
        Role userRoleEntity; // The single Role entity to assign

        if (StringUtils.hasText(strRole)) { // Check if a role string was provided
            // Role provided in request, find it (ensure consistency e.g., ROLE_ADMIN or ADMIN)
            // Let's assume stored names are ROLE_ADMIN, ROLE_SELLER, ROLE_USER
            String roleNameToFind = strRole.toUpperCase();
            if (!roleNameToFind.startsWith("ROLE_")) {
                roleNameToFind = "ROLE_" + roleNameToFind; // Add prefix if missing
            }

            userRoleEntity = roleRepository.findByName(roleNameToFind)
                    .orElseThrow(() -> new RuntimeException("Error: Role " + strRole + " is not found."));
        } else {
            // No role provided, assign default ROLE_USER
            userRoleEntity = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Error: Default role ROLE_USER is not found."));
        }

        Set<Role> roles = new HashSet<>();
        roles.add(userRoleEntity); // Add the single determined role to the Set
        // ===> DEĞİŞEN ROL ATAMA MANTIĞI SONU <===

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}