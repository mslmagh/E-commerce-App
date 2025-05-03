package com.example.ecommerce.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min; // For @Min
import java.math.BigDecimal; // Import BigDecimal

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 500) // Set max length for description
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price; // Use BigDecimal for price

    // ===> YENİ STOK ALANI <===
    @Min(0) // Stock cannot be negative
    @Column(name = "stock_quantity", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer stockQuantity = 0; // Default stock to 0
    // ===> YENİ STOK ALANI SONU <===

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_user_id", referencedColumnName = "id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;


    // Constructors
    public Product() {}

    // Getters and Setters (Including new stockQuantity)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; } // Return BigDecimal
    public void setPrice(BigDecimal price) { this.price = price; } // Accept BigDecimal
    public Integer getStockQuantity() { return stockQuantity; } // Getter for stock
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; } // Setter for stock
    public User getSeller() { return seller; }
    public void setSeller(User seller) { this.seller = seller; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}