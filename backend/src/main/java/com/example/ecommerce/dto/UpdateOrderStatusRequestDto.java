package com.example.ecommerce.dto;

import com.example.ecommerce.entity.OrderStatus; // Import Enum
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequestDto {

    @Schema(description = "The new status for the order", requiredMode = Schema.RequiredMode.REQUIRED, example = "SHIPPED")
    @NotNull(message = "New status cannot be null")
    private OrderStatus newStatus; // Use the Enum type

    // Getters & Setters
    public OrderStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OrderStatus newStatus) { this.newStatus = newStatus; }
}