package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "DTO representing a user address for API responses")
public class AddressDto {
    @Schema(description = "Unique identifier of the address", example = "1")
    private Long id;
    @Schema(description = "Phone number associated with the address", example = "5551234567")
    private String phoneNumber;
    @Schema(description = "Country", example = "Türkiye")
    private String country;
    @Schema(description = "City", example = "Ankara")
    private String city;
    @Schema(description = "Postal code", example = "06500")
    private String postalCode;
    @Schema(description = "Full address text", example = "Örnek Mah. Test Sok. No:1 D:2 Çankaya")
    private String addressText;
    @Schema(description = "ID of the user this address belongs to", example = "10")
    private Long userId; // Include user ID

    // Constructor
    public AddressDto(Long id, String phoneNumber, String country, String city, String postalCode, String addressText, Long userId) {
        this.id = id; this.phoneNumber = phoneNumber; this.country = country; this.city = city;
        this.postalCode = postalCode; this.addressText = addressText; this.userId = userId;
    }
    public AddressDto() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}