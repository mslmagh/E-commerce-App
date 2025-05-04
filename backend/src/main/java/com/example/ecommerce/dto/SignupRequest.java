package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
// import java.util.Set; // <<<--- Set import'unu kaldırın

public class SignupRequest {

    @Schema(description = "Desired username for the new account", requiredMode = Schema.RequiredMode.REQUIRED, example = "newuser")
    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Schema(description = "Desired password for the new account", requiredMode = Schema.RequiredMode.REQUIRED, example = "strongPassword!1")
    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 120, message = "Password must be between 6 and 120 characters")
    private String password;

    @Schema(description = "Email address for the new account", example = "newuser@example.com")
    @Email(message = "Email should be valid")
    @Size(max = 80, message = "Email length cannot exceed 80 characters")
    private String email;

    @Schema(description = "Requested role for the user (e.g., 'SELLER', 'USER'). Optional, defaults to 'USER' if not provided.",
            example = "SELLER")
    private String role; // Changed from Set<String> roles


    // --- Getters and Setters ---
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}