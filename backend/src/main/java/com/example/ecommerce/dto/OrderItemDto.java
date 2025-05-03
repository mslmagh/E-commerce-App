package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

public class OrderItemDto {
    @Schema(description = "ID of the product in the order item", example = "1")
    private Long productId;
    @Schema(description = "Name of the product", example = "Laptop Model A")
    private String productName;
    @Schema(description = "Quantity ordered", example = "1")
    private Integer quantity;
    @Schema(description = "Price of the product at the time of purchase", example = "15500.75")
    private BigDecimal priceAtPurchase;

    // Constructor
    public OrderItemDto(Long productId, String productName, Integer quantity, BigDecimal priceAtPurchase) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.priceAtPurchase = priceAtPurchase;
    }
    public OrderItemDto() {} // Default constructor

    // Getters & Setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getPriceAtPurchase() { return priceAtPurchase; }
    public void setPriceAtPurchase(BigDecimal priceAtPurchase) { this.priceAtPurchase = priceAtPurchase; }
}