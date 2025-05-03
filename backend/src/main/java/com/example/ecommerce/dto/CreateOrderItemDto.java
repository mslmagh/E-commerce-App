package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateOrderItemDto {

    @Schema(description = "ID of the product being ordered", requiredMode = Schema.RequiredMode.REQUIRED, example = "1")
    @NotNull(message = "Product ID cannot be null")
    private Long productId;

    @Schema(description = "Quantity of the product being ordered", requiredMode = Schema.RequiredMode.REQUIRED, example = "2")
    @NotNull(message = "Quantity cannot be null")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Getters & Setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}