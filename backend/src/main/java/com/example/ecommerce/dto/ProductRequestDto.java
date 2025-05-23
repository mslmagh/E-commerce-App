package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Schema(description = "DTO for creating or updating a product")
public class ProductRequestDto {

    @Schema(description = "Name of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "New/Updated Laptop")
    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @Schema(description = "Detailed description of the product (optional)", example = "Laptop details here")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Schema(description = "Price of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "1999.99")
    @NotNull(message = "Product price cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be zero or positive")
    private BigDecimal price;

    @Schema(description = "Stock quantity", requiredMode = Schema.RequiredMode.REQUIRED, example = "50")
    @NotNull(message = "Stock quantity cannot be null")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    @Schema(description = "ID of the category for the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "1")
    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    @Schema(description = "URL of the product image (must be a valid URL)", example = "https://i.imgur.com/5yfRfJ2.jpeg")
    @Size(max = 512, message = "Image URL cannot exceed 512 characters")
    private String imageUrl; 

    @Schema(description = "ID of the seller for the product (required for Admin, optional for Seller creating their own product)", example = "2")
    private Long sellerId;


    // Getters & Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
}