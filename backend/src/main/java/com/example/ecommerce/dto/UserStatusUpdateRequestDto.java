package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "DTO for updating a user's account status (enabled/disabled) by an admin")
public class UserStatusUpdateRequestDto {

    @Schema(description = "The new enabled status for the user account (true for enabled, false for disabled)",
            requiredMode = Schema.RequiredMode.REQUIRED, example = "true")
    @NotNull(message = "Enabled status cannot be null")
    private Boolean enabled; // Wrapper Boolean for @NotNull to work as expected

    public UserStatusUpdateRequestDto() {
    }

    public UserStatusUpdateRequestDto(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean isEnabled() { // Getter for Boolean type
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}