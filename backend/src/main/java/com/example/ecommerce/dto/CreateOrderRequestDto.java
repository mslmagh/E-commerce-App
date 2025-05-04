package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
public class CreateOrderRequestDto {

    @Schema(description = "ID of the shipping address to use for this order", requiredMode = Schema.RequiredMode.REQUIRED, example = "7")
    @NotNull(message = "Shipping address ID cannot be null")
    private Long shippingAddressId;

    public Long getShippingAddressId() {
        return shippingAddressId;
    }

    public void setShippingAddressId(Long shippingAddressId) {
        this.shippingAddressId = shippingAddressId;
    }
}