package com.example.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for creating or updating a user address")
public class AddressRequestDto { // Renamed from SaveAddressRequestDto

    @Schema(description = "Phone number", requiredMode = Schema.RequiredMode.REQUIRED, example = "5559876543")
    @NotBlank(message = "Phone number cannot be blank")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @JsonProperty("phoneNumber")
    private String phoneNumber;

    @Schema(description = "Country", requiredMode = Schema.RequiredMode.REQUIRED, example = "Türkiye")
    @NotBlank(message = "Country cannot be blank")
    @Size(max = 50, message = "Country name cannot exceed 50 characters")
    @JsonProperty("country")
    private String country;

    @Schema(description = "City", requiredMode = Schema.RequiredMode.REQUIRED, example = "İstanbul")
    @NotBlank(message = "City cannot be blank")
    @Size(max = 50, message = "City name cannot exceed 50 characters")
    @JsonProperty("city")
    private String city;

    @Schema(description = "Postal code", requiredMode = Schema.RequiredMode.REQUIRED, example = "34700")
    @NotBlank(message = "Postal code cannot be blank")
    @Size(max = 10, message = "Postal code cannot exceed 10 characters")
    @JsonProperty("postalCode")
    private String postalCode;

    @Schema(description = "Full address text", requiredMode = Schema.RequiredMode.REQUIRED, example = "Deneme Cad. No: 10 Kadıköy")
    @NotBlank(message = "Address text cannot be blank")
    @Size(max = 255, message = "Address text cannot exceed 255 characters")
    @JsonProperty("addressText")
    private String addressText;

    // Default no-argument constructor required by Jackson
    public AddressRequestDto() {
    }

    // JSON Creator constructor to ensure proper deserialization
    @JsonCreator
    public AddressRequestDto(
        @JsonProperty("phoneNumber") String phoneNumber,
        @JsonProperty("country") String country,
        @JsonProperty("city") String city,
        @JsonProperty("postalCode") String postalCode,
        @JsonProperty("addressText") String addressText
    ) {
        this.phoneNumber = phoneNumber;
        this.country = country;
        this.city = city;
        this.postalCode = postalCode;
        this.addressText = addressText;
    }

    // Getters & Setters
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    @Override
    public String toString() {
        return "AddressRequestDto{" +
                "phoneNumber='" + phoneNumber + '\'' +
                ", country='" + country + '\'' +
                ", city='" + city + '\'' +
                ", postalCode='" + postalCode + '\'' +
                ", addressText='" + addressText + '\'' +
                '}';
    }
}