package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal; // Import BigDecimal
import java.time.LocalDateTime; // LocalDateTime import edildi

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

    @Schema(description = "Average rating of the product", example = "4.50")
    private BigDecimal averageRating;

    @Schema(description = "Total number of reviews for the product", example = "120")
    private Integer reviewCount;

    // Soft delete alanları eklendi
    @Schema(description = "Indicates if the product is active and available for sale", example = "true")
    private boolean isActive;

    @Schema(description = "Reason why the product was deactivated", example = "Discontinued by manufacturer", nullable = true)
    private String deactivationReason;

    @Schema(description = "Timestamp when the product was deactivated", nullable = true)
    private LocalDateTime deactivatedAt;

    public ProductDto(Long id, String name, String description, BigDecimal price, Integer stockQuantity, Long categoryId, String categoryName, String imageUrl, BigDecimal averageRating, Integer reviewCount, boolean isActive, String deactivationReason, LocalDateTime deactivatedAt) {
        this.imageUrl = imageUrl;
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
        this.isActive = isActive;
        this.deactivationReason = deactivationReason;
        this.deactivatedAt = deactivatedAt;
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
    public BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }
    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

    // Yeni alanlar için Getter ve Setterlar
    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getDeactivationReason() {
        return deactivationReason;
    }

    public void setDeactivationReason(String deactivationReason) {
        this.deactivationReason = deactivationReason;
    }

    public LocalDateTime getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(LocalDateTime deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }
}