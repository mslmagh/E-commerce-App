package com.example.ecommerce.repository; // Make sure this package declaration is correct

import com.example.ecommerce.entity.Product; // Import the Product entity

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // Import JpaRepository
// import org.springframework.stereotype.Repository; // This annotation is optional

// No need for @Repository usually, as extending JpaRepository registers it as a bean
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Basic CRUD methods (findAll, findById, save, deleteById, etc.)
    // are automatically provided by Spring Data JPA.

    // Custom query methods can be added here later if needed.
    // Example: List<Product> findByNameContainingIgnoreCase(String keyword);
    List<Product> findBySellerUsername(String username);
    List<Product> findByCategoryId(Long categoryId);

    // Sadece aktif ürünleri getiren metotlar (genel kullanıcılar için)
    List<Product> findAllByIsActiveTrue();
    List<Product> findByCategoryIdAndIsActiveTrue(Long categoryId);
    java.util.Optional<Product> findByIdAndIsActiveTrue(Long id);

    List<Product> findBySellerUsernameAndIsActiveTrue(String username);
}