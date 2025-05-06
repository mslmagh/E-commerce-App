package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    // Bir kullanıcının belirli bir ürüne yorum yapıp yapmadığını kontrol etmek için
    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    // Bir ürünün tüm yorumlarını (puanlarını) getirmek için (ortalama hesaplamada kullanılabilir)
    @Query("SELECT r.rating FROM Review r WHERE r.product.id = :productId")
    List<Integer> findRatingsByProductId(@Param("productId") Long productId);
}