package com.example.ecommerce.entity;

import jakarta.persistence.*;
import java.math.BigDecimal; // Use BigDecimal for currency
import java.time.LocalDateTime; // Use LocalDateTime for dates
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders") // Use plural for table name
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime orderDate;

    @Column(nullable = false, length = 50)
    private String status; // e.g., PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED

    @Column(nullable = false, precision = 10, scale = 2) // Precision for currency
    private BigDecimal totalAmount;

    // Relationship to the customer (User) who placed the order
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_user_id", referencedColumnName = "id", nullable = false)
    private User customer;

    // Relationship to OrderItems (One Order has Many OrderItems)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();

    // Constructors
    public Order() {
        this.orderDate = LocalDateTime.now(); // Set current date on creation
        this.status = "PENDING"; // Default status
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }

    // Helper method to add order items and maintain consistency
    public void addOrderItem(OrderItem item) {
        this.orderItems.add(item);
        item.setOrder(this);
    }
}