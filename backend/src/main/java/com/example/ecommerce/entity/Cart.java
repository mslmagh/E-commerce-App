package com.example.ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cart belongs to one User (OneToOne relationship)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true) // Foreign key in carts table
    private User user;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // Cart has many CartItems
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    // Constructors
    public Cart() {
        this.lastUpdated = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }

    // Helper methods to manage items and update timestamp
    public void addItem(CartItem item) {
        this.items.add(item);
        item.setCart(this);
        this.lastUpdated = LocalDateTime.now();
    }

    public void removeItem(CartItem item) {
        this.items.remove(item);
        item.setCart(null);
        this.lastUpdated = LocalDateTime.now();
    }
}