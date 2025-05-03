package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*; // Import all validation constraints
import java.math.BigDecimal; // Import BigDecimal

@Schema(description = "DTO for creating a new product")
public class CreateProductRequestDto {

    @Schema(description = "Name of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "Wireless Mouse")
    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @Schema(description = "Detailed description of the product (optional)", example = "Ergonomic wireless mouse with USB receiver")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Schema(description = "Price of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "45.50")
    @NotNull(message = "Product price cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be zero or positive")
    private BigDecimal price; // Use BigDecimal

    @Schema(description = "Initial stock quantity", requiredMode = Schema.RequiredMode.REQUIRED, example = "100")
    @NotNull(message = "Stock quantity cannot be null")
    @Min(value = 0, message = "Stock quantity cannot be negative") // Stock cannot be negative
    private Integer stockQuantity; // <<<--- YENİ ALAN

    @Schema(description = "ID of the category to assign the product to", requiredMode = Schema.RequiredMode.REQUIRED, example = "1")
    @NotNull(message = "Category ID cannot be null")
    private Long categoryId;

    // Getters & Setters (Including new stockQuantity)
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
}