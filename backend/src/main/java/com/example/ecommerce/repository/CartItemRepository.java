package com.example.ecommerce.repository;

import com.example.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // Find a specific item within a specific cart by product ID
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
}