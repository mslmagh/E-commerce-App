package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

public class CartItemDto {
    @Schema(example = "50") private Long itemId;
    @Schema(example = "1") private Long productId;
    @Schema(example = "Laptop Model A") private String productName;
    @Schema(example = "2") private Integer quantity;
    @Schema(example = "15500.75") private BigDecimal unitPrice;
    @Schema(example = "31001.50") private BigDecimal totalPrice;

    public CartItemDto(Long itemId, Long productId, String productName, Integer quantity, BigDecimal unitPrice) {
        this.itemId = itemId; this.productId = productId; this.productName = productName;
        this.quantity = quantity; this.unitPrice = unitPrice;
        this.totalPrice = (unitPrice != null && quantity != null) ? unitPrice.multiply(BigDecimal.valueOf(quantity)) : BigDecimal.ZERO;
    }
    public CartItemDto() {}

    // Getters & Setters
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}