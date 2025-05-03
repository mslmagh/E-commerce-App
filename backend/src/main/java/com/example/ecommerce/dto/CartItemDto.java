package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "DTO representing an item within a shopping cart")
public class CartItemDto {
    @Schema(description = "ID of the cart item itself", example = "50")
    private Long itemId; // Renamed from id to avoid confusion maybe
    @Schema(description = "ID of the product", example = "1")
    private Long productId;
    @Schema(description = "Name of the product", example = "Laptop Model A")
    private String productName;
    @Schema(description = "Quantity of the product in the cart", example = "2")
    private Integer quantity;
    @Schema(description = "Current price per unit of the product", example = "15500.75")
    private BigDecimal unitPrice; // Current price from Product entity
    @Schema(description = "Total price for this cart item (quantity * unitPrice)", example = "31001.50")
    private BigDecimal totalPrice; // Calculated field

    // Constructor
    public CartItemDto(Long itemId, Long productId, String productName, Integer quantity, BigDecimal unitPrice) {
        this.itemId = itemId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        if (unitPrice != null && quantity != null) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        } else {
            this.totalPrice = BigDecimal.ZERO;
        }
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