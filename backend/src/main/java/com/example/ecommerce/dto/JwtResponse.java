package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public class JwtResponse {
    @Schema(description = "Generated JWT access token")
    private String token;
    @Schema(description = "Token type", example = "Bearer")
    private String type = "Bearer"; // Standard prefix for JWT tokens
    @Schema(description = "ID of the logged in user")
    private Long id;
    @Schema(description = "Username of the logged in user")
    private String username;
    @Schema(description = "Email of the logged in user")
    private String email;
    @Schema(description = "List of roles assigned to the logged in user")
    private List<String> roles; // Typically send role names as strings

    // Constructor
    public JwtResponse(String accessToken, Long id, String username, String email, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    // --- Getters --- (Setters might not be needed if only constructed)
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; } // Setter added for completeness
    public String getType() { return type; }
    public void setType(String type) { this.type = type; } // Setter added for completeness
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; } // Setter added for completeness
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; } // Setter added for completeness
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; } // Setter added for completeness
    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; } // Setter added for completeness
}