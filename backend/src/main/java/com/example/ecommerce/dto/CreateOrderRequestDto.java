package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CreateOrderRequestDto {

    @Schema(description = "List of items included in the order", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "Order must contain at least one item")
    @Valid // Validate each item in the list
    private List<CreateOrderItemDto> items;

    // Getters & Setters
    public List<CreateOrderItemDto> getItems() { return items; }
    public void setItems(List<CreateOrderItemDto> items) { this.items = items; }
}