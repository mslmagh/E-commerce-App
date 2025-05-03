package com.example.ecommerce.repository;

import com.example.ecommerce.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    // Basic CRUD methods are enough for now
}