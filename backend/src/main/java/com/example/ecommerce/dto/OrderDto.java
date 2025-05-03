package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {
    @Schema(description = "Unique identifier of the order", example = "101")
    private Long id;
    @Schema(description = "Date and time when the order was placed")
    private LocalDateTime orderDate;
    @Schema(description = "Current status of the order", example = "PENDING")
    private String status;
    @Schema(description = "Total amount for the order", example = "16350.75")
    private BigDecimal totalAmount;
    @Schema(description = "ID of the customer who placed the order", example = "5")
    private Long customerId;
    @Schema(description = "Username of the customer who placed the order", example = "testuser1")
    private String customerUsername;
    @Schema(description = "List of items included in the order")
    private List<OrderItemDto> items;

    // Constructor
    public OrderDto(Long id, LocalDateTime orderDate, String status, BigDecimal totalAmount, Long customerId, String customerUsername, List<OrderItemDto> items) {
        this.id = id;
        this.orderDate = orderDate;
        this.status = status;
        this.totalAmount = totalAmount;
        this.customerId = customerId;
        this.customerUsername = customerUsername;
        this.items = items;
    }
    public OrderDto() {} // Default constructor

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerUsername() { return customerUsername; }
    public void setCustomerUsername(String customerUsername) { this.customerUsername = customerUsername; }
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}