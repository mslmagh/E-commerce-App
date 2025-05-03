package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set; // Import Set for roles

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
    @Email(message = "Email should be valid") // Basic email format validation
    @Size(max = 80, message = "Email length cannot exceed 80 characters")
    private String email; // Optional, so no @NotBlank

    @Schema(description = "Set of roles requested for the user (e.g., 'ADMIN', 'SELLER', 'USER'). Optional, defaults to 'USER' if not provided or handled by service.",
            example = "[\"SELLER\", \"USER\"]")
    private Set<String> roles; // We'll handle how roles are assigned in the service layer

    // --- Getters and Setters ---
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}