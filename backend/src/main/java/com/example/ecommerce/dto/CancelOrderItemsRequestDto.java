package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CancelOrderItemsRequestDto {

    @Schema(description = "List of OrderItem IDs to be cancelled/refunded", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotEmpty(message = "At least one order item ID must be provided for cancellation/refund.")
    private List<Long> orderItemIds;

    @Schema(description = "Reason for cancellation/refund (optional)", example = "Product out of stock / Customer request")
    private String reason; // Opsiyonel iade nedeni

    // Getters and Setters
    public List<Long> getOrderItemIds() { return orderItemIds; }
    public void setOrderItemIds(List<Long> orderItemIds) { this.orderItemIds = orderItemIds; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}