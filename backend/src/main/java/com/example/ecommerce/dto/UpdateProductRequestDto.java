package com.example.ecommerce.dto;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for updating an existing product")
public class UpdateProductRequestDto {

    @Schema(description = "ID of the category to assign the product to", requiredMode = Schema.RequiredMode.REQUIRED, example = "2")
    @NotNull(message = "Category ID cannot be null") // <<<--- YENİ ALAN VE VALIDASYON
    private Long categoryId;

    @Schema(description = "New name of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "Updated Wireless Mouse")
    @NotBlank(message = "Product name cannot be blank")
    @Size(min = 2, max = 100, message = "Product name must be between 2 and 100 characters")
    private String name;

    @Schema(description = "New detailed description of the product (optional)", example = "Ergonomic wireless mouse with USB receiver - V2")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Schema(description = "New price of the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "49.99")
    @NotNull(message = "Product price cannot be null")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be zero or positive")
    private BigDecimal price;

    // --- Getters and Setters ---
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
}