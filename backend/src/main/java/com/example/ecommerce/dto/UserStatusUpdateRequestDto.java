package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "DTO for updating a user's account status (enabled/disabled) by an admin")
public class UserStatusUpdateRequestDto {

    @Schema(description = "The new enabled status for the user account (true for enabled, false for disabled)",
            requiredMode = Schema.RequiredMode.REQUIRED, example = "true")
    @JsonProperty("enabled")
    private boolean enabled;

    public UserStatusUpdateRequestDto() {
        // Primitive boolean zaten varsayılan olarak false olur.
    }

    public UserStatusUpdateRequestDto(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}