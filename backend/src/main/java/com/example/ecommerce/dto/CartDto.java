package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

public class CartDto {
    @Schema(example = "1") private Long cartId;
    @Schema(example = "10") private Long userId;
    private List<CartItemDto> items;
    @Schema(example = "31851.50") private BigDecimal grandTotal;

    public CartDto(Long cartId, Long userId, List<CartItemDto> items) {
        this.cartId = cartId; this.userId = userId; this.items = items;
        this.grandTotal = items.stream().map(CartItemDto::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    public CartDto() {}

    // Getters & Setters
    public Long getCartId() { return cartId; }
    public void setCartId(Long cartId) { this.cartId = cartId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<CartItemDto> getItems() { return items; }
    public void setItems(List<CartItemDto> items) { this.items = items; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
}