package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

@Schema(description = "DTO for updating a user's roles by an admin")
public class UserRoleUpdateRequestDto {

    @Schema(description = "Set of new role names for the user (e.g., [\"ROLE_USER\", \"ROLE_SELLER\"])",
            requiredMode = Schema.RequiredMode.REQUIRED, example = "[\"ROLE_USER\", \"ROLE_SELLER\"]")
    @NotEmpty(message = "Roles set cannot be empty. To remove all roles, consider deactivating the user or assigning a minimal role.")
    private Set<String> roles; // Role isimlerini String olarak alacağız

    public UserRoleUpdateRequestDto() {
    }

    public UserRoleUpdateRequestDto(Set<String> roles) {
        this.roles = roles;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }
}