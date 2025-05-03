package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

@Schema(description = "DTO representing the user's shopping cart")
public class CartDto {
    @Schema(description = "ID of the cart", example = "1")
    private Long cartId;
    @Schema(description = "ID of the user owning the cart", example = "10")
    private Long userId;
    @Schema(description = "List of items currently in the cart")
    private List<CartItemDto> items;
    @Schema(description = "Total price of all items in the cart", example = "31851.50")
    private BigDecimal grandTotal; // Calculated field

    // Constructor
    public CartDto(Long cartId, Long userId, List<CartItemDto> items) {
        this.cartId = cartId;
        this.userId = userId;
        this.items = items;
        this.grandTotal = items.stream()
                               .map(CartItemDto::getTotalPrice)
                               .reduce(BigDecimal.ZERO, BigDecimal::add); // Sum up total prices
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