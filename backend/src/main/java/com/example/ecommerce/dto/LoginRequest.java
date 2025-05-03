package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @Schema(description = "Username of the user trying to log in", requiredMode = Schema.RequiredMode.REQUIRED, example = "testuser")
    @NotBlank(message = "Username cannot be blank")
    private String username;

    @Schema(description = "Password of the user trying to log in", requiredMode = Schema.RequiredMode.REQUIRED, example = "password123")
    @NotBlank(message = "Password cannot be blank")
    private String password;

    // --- Getters and Setters ---
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}