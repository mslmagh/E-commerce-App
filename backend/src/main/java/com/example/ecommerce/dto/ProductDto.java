package com.example.ecommerce.dto;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema; // Import Schema annotation

@Schema(description = "Data Transfer Object representing a product for API responses") // English comment
public class ProductDto {
    // ... (id, name, description, price alanları ve getter/setterları aynı) ...
    @Schema(description = "ID of the product's category", example = "3")
    private Long categoryId; // <<<--- YENİ ALAN

    @Schema(description = "Name of the product's category", example = "Electronics")
    private String categoryName; // <<<--- YENİ ALAN

    @Schema(description = "Unique identifier of the product", example = "1") // English comment
    private Long id;

    @Schema(description = "Name of the product", example = "Gaming Laptop X") // English comment
    private String name;

    @Schema(description = "Detailed description of the product", example = "High-end gaming laptop with latest specs") // English comment
    private String description;

    @Schema(description = "Price of the product", example = "2499.99") // English comment
    private BigDecimal price;

   
public ProductDto(Long id, String name, String description, BigDecimal price, Long categoryId, String categoryName) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.categoryId = categoryId; // <<<--- YENİ ATAMA
        this.categoryName = categoryName; // <<<--- YENİ ATAMA
    }
    public ProductDto() {} // Default constructor

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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
     public Long getCategoryId() { return categoryId; }
     public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
     public String getCategoryName() { return categoryName; }
     public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}