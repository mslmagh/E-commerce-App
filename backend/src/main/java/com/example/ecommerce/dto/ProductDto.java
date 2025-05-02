package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema; // Import Schema annotation

@Schema(description = "Data Transfer Object representing a product for API responses") // English comment
public class ProductDto {

    @Schema(description = "Unique identifier of the product", example = "1") // English comment
    private Long id;

    @Schema(description = "Name of the product", example = "Gaming Laptop X") // English comment
    private String name;

    @Schema(description = "Detailed description of the product", example = "High-end gaming laptop with latest specs") // English comment
    private String description;

    @Schema(description = "Price of the product", example = "2499.99") // English comment
    private Double price;

    // Default constructor (may be required by some frameworks/libraries)
    public ProductDto() {
    }

    // Constructor with fields
    public ProductDto(Long id, String name, String description, Double price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
    }

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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