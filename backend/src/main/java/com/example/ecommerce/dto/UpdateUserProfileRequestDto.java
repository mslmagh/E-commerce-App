package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for updating user profile information")
public class UpdateUserProfileRequestDto {

    @NotBlank(message = "First name cannot be blank")
    @Size(max = 50, message = "First name cannot exceed 50 characters")
    @Schema(description = "User's first name", example = "John", requiredMode = Schema.RequiredMode.REQUIRED)
    private String firstName;

    @NotBlank(message = "Last name cannot be blank")
    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    @Schema(description = "User's last name", example = "Doe", requiredMode = Schema.RequiredMode.REQUIRED)
    private String lastName;

    @NotBlank(message = "Phone number cannot be blank")
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Phone number format is invalid. Expected format e.g., +905551234567 or 05551234567")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Schema(description = "User's phone number", example = "5551234567", requiredMode = Schema.RequiredMode.REQUIRED)
    private String phoneNumber;

    @Size(max = 20, message = "Tax ID cannot exceed 20 characters")
    @Schema(description = "User's tax ID (only for sellers, can be null if not applicable or not being updated)", example = "1234567890")
    private String taxId; // Nullable, frontend will send it only if user is seller and it's being updated

    // Constructors
    public UpdateUserProfileRequestDto() {
    }

    public UpdateUserProfileRequestDto(String firstName, String lastName, String phoneNumber, String taxId) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.taxId = taxId;
    }

    // Getters and Setters
    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }
} 