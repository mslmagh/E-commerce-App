package com.example.ecommerce.repository;

import com.example.ecommerce.entity.ProductComparison;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductComparisonRepository extends JpaRepository<ProductComparison, Long> {
    List<ProductComparison> findByUser(User user);
    boolean existsByUserAndProduct(User user, Product product);
    void deleteByUserAndProduct(User user, Product product);
    void deleteByUser(User user);
} 