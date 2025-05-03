package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // Find orders by customer's username
    List<Order> findByCustomerUsername(String username);

    // Find orders containing products from a specific seller
    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi JOIN oi.product p WHERE p.seller.id = :sellerId ORDER BY o.orderDate DESC")
    List<Order> findOrdersContainingProductFromSeller(@Param("sellerId") Long sellerId);
}