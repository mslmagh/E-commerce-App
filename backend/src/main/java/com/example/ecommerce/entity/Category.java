package com.example.ecommerce.entity;

import jakarta.persistence.*;
import java.util.HashSet; // Import HashSet
import java.util.Set; // Import Set

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 50) // Category name must be unique and not null
    private String name;

    // Relationship with Product: One Category has Many Products
    // 'mappedBy = "category"' indicates that the 'category' field in the Product entity owns the relationship
    // CascadeType.ALL means operations (persist, remove, etc.) on Category might cascade to associated Products (Use with caution!)
    // FetchType.LAZY means products won't be loaded automatically unless explicitly requested.
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<Product> products = new HashSet<>(); // Initialize the set

    // Constructors
    public Category() {
    }

    public Category(String name) {
        this.name = name;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Product> getProducts() {
        return products;
    }

    public void setProducts(Set<Product> products) {
        this.products = products;
    }

    // Optional: Helper methods to add/remove products safely
    public void addProduct(Product product) {
        this.products.add(product);
        product.setCategory(this); // Keep both sides of the relationship in sync
    }

    public void removeProduct(Product product) {
        this.products.remove(product);
        product.setCategory(null); // Keep both sides of the relationship in sync
    }

    // equals, hashCode might be needed if used in Sets/Maps based on more than ID
    // toString for logging
}