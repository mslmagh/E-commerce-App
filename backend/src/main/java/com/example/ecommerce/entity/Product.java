package com.example.ecommerce.entity;

import jakarta.persistence.*; // JPA anotasyonları için

import java.math.BigDecimal;

import com.example.ecommerce.entity.User;

@Entity // Bu sınıfın bir veritabanı varlığı olduğunu belirtir
@Table(name = "products") // İlişkili olduğu veritabanı tablosunun adı
public class Product {

    @Id // Bu alanın birincil anahtar (primary key) olduğunu belirtir
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ID'nin otomatik artan olacağını belirtir
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // FetchType.LAZY genellikle daha performanslıdır
    @JoinColumn(name = "seller_user_id", referencedColumnName = "id", nullable = false) // Veritabanındaki foreign key                                                                     // sütunu
    private User seller;

    // ===> YENİ ALAN: Ürünün Kategorisi <===
    @ManyToOne(fetch = FetchType.LAZY) // A Product belongs to One Category
    @JoinColumn(name = "category_id") // Foreign key column in the 'products' table, defaults to nullable
    private Category category; 

    @Column(name = "name", nullable = false) // Sütun adı ve boş bırakılamaz kısıtlaması
    private String name;

    @Column(name = "description") // Sütun adı (opsiyonel, belirtmezsek alan adıyla aynı olur)
    private String description;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    // Constructors (Yapıcı Metotlar)
    public Product() {
        // Varsayılan yapıcı (JPA için gerekli olabilir)
    }
    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
    public Product(String name, String description, BigDecimal price) {
        this.name = name;
        this.description = description;
        this.price = price;
    }

    // Getters and Setters (Erişim Metotları)
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }
    // equals, hashCode, toString metotları da eklenebilir (opsiyonel)
}