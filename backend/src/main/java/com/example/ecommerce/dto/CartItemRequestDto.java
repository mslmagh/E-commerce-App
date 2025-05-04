package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "DTO for adding or updating an item in the cart")
public class CartItemRequestDto {

    @Schema(description = "ID of the product to add/update", requiredMode = Schema.RequiredMode.REQUIRED, example = "2")
    @NotNull(message = "Product ID cannot be null")
    private Long productId;

    @Schema(description = "Desired quantity for the product", requiredMode = Schema.RequiredMode.REQUIRED, example = "3")
    @NotNull(message = "Quantity cannot be null")
    @Min(value = 1, message = "Quantity must be at least 1") // Minimum quantity is 1
    private Integer quantity;

    // Getters & Setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}