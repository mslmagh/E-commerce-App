package com.example.ecommerce.entity; // Or enums package

public enum OrderStatus {
    PENDING,        // Order placed, awaiting processing
    PREPARING,      // Seller is preparing the order
    SHIPPED,        // Order has been shipped
    DELIVERED,      // Order has been delivered
    CANCELLED       // Order has been cancelled
}