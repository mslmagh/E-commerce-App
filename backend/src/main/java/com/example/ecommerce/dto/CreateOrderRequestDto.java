package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
// Remove List and NotEmpty/Valid imports if they were specifically for items

public class CreateOrderRequestDto {

    @Schema(description = "ID of the selected shipping address for the order", requiredMode = Schema.RequiredMode.REQUIRED, example = "7")
    @NotNull(message = "Shipping address ID cannot be null")
    private Long shippingAddressId;

    // Remove the 'items' list field
    // private List<CreateOrderItemDto> items;

    // Getters & Setters for shippingAddressId
    public Long getShippingAddressId() {
        return shippingAddressId;
    }

    public void setShippingAddressId(Long shippingAddressId) {
        this.shippingAddressId = shippingAddressId;
    }
}