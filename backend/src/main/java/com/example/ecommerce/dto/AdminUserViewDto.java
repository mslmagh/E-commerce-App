package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Set;

@Schema(description = "Data Transfer Object for displaying user details in admin views")
public class AdminUserViewDto {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "Username", example = "john_doe")
    private String username;

    @Schema(description = "Email address", example = "john.doe@example.com")
    private String email;

    @Schema(description = "Indicates if the user account is enabled", example = "true")
    private boolean enabled;

    @Schema(description = "Set of roles assigned to the user (e.g., [\"ROLE_USER\", \"ROLE_SELLER\"])")
    private Set<String> roles;

    @Schema(description = "Tax ID, typically for users with a SELLER role", example = "TR1234567890")
    private String taxId;

    // Constructors
    public AdminUserViewDto() {
    }

    public AdminUserViewDto(Long id, String username, String email, boolean enabled, Set<String> roles, String taxId) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.enabled = enabled;
        this.roles = roles;
        this.taxId = taxId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }
}