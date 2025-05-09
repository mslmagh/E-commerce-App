package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

public class OrderItemDto {

    @Schema(description = "ID of the order item itself", example = "101")
    private Long id; // OrderItem'ın kendi ID'si

    @Schema(description = "ID of the product in the order item", example = "1")
    private Long productId;
    @Schema(description = "Name of the product", example = "Laptop Model A")
    private String productName;
    @Schema(description = "Quantity ordered", example = "1")
    private Integer quantity;
    @Schema(description = "Price of the product at the time of purchase", example = "15500.75")
    private BigDecimal priceAtPurchase;
    @Schema(description = "Status of this order item", example = "ACTIVE")
    private String status; // OrderItemStatus enum'ının string temsili

    @Schema(description = "Stripe Refund ID if this item was refunded", example = "re_xxxxxxxxxxxxxx")
    private String stripeRefundId;

    @Schema(description = "Amount refunded for this item (if applicable)", example = "15500.75")
    private BigDecimal refundedAmount;

    // Constructor

    public OrderItemDto(Long id, Long productId, String productName, Integer quantity, BigDecimal priceAtPurchase,
            String status, String stripeRefundId, BigDecimal refundedAmount) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.priceAtPurchase = priceAtPurchase;
        this.status = status;
        this.stripeRefundId = stripeRefundId;
        this.refundedAmount = refundedAmount;
    }

    public OrderItemDto() {
    } // Default constructor

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPriceAtPurchase() {
        return priceAtPurchase;
    }

    public void setPriceAtPurchase(BigDecimal priceAtPurchase) {
        this.priceAtPurchase = priceAtPurchase;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStripeRefundId() {
        return stripeRefundId;
    }

    public void setStripeRefundId(String stripeRefundId) {
        this.stripeRefundId = stripeRefundId;
    }

    public BigDecimal getRefundedAmount() {
        return refundedAmount;
    }

    public void setRefundedAmount(BigDecimal refundedAmount) {
        this.refundedAmount = refundedAmount;
    }
}