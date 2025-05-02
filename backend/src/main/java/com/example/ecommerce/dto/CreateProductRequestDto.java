package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin; // Import validation annotations
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for creating a new product")
public class CreateProductRequestDto {

    @Schema(description = "Name of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "Wireless Mouse")
    @NotBlank(message = "Product name cannot be blank") // Cannot be null or empty whitespace
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters") // Size constraint
    private String name;

    @Schema(description = "Detailed description of the product (optional)", example = "Ergonomic wireless mouse with USB receiver")
    @Size(max = 500, message = "Description cannot exceed 500 characters") // Optional field, but if present has max size
    private String description; // Not required, so no @NotBlank

    @Schema(description = "Price of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "45.50")
    @NotNull(message = "Product price cannot be null") // Cannot be null
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be zero or positive") // Must be >= 0
    private Double price;

    // --- Getters and Setters ---
    // Needed for Spring to map JSON data to this object

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}