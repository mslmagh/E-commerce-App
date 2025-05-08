package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal; // Import BigDecimal

@Schema(description = "Data Transfer Object representing a product for API responses")
public class ProductDto {

    @Schema(description = "Unique identifier of the product", example = "1")
    private Long id;

    @Schema(description = "Name of the product", example = "Gaming Laptop X")
    private String name;

    @Schema(description = "Detailed description of the product", example = "High-end gaming laptop with latest specs")
    private String description;

    @Schema(description = "Price of the product", example = "2499.99")
    private BigDecimal price;

    @Schema(description = "Available stock quantity", example = "50")
    private Integer stockQuantity;

    @Schema(description = "ID of the product's category", example = "3")
    private Long categoryId;

    @Schema(description = "Name of the product's category", example = "Electronics")
    private String categoryName;

    @Schema(description = "URL of the product image", example = "https://i.imgur.com/5yfRfJ2.jpeg")
    private String imageUrl;

    public ProductDto(Long id, String name, String description, BigDecimal price, Integer stockQuantity, Long categoryId, String categoryName, String imageUrl) {
        this.imageUrl = imageUrl;
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity; // <<<--- YENİ ATAMA
        this.categoryId = categoryId;
        this.categoryName = categoryName;
    }
    public ProductDto() {} // Default constructor

    // Getters & Setters (Including new stockQuantity)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; } // Return BigDecimal
    public void setPrice(BigDecimal price) { this.price = price; } // Accept BigDecimal
    public Integer getStockQuantity() { return stockQuantity; } // Getter for stock
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; } // Setter for stock
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}