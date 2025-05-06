// src/main/java/com/example/ecommerce/repository/ReviewRepository.java
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

    // YENİ METOT: JOIN FETCH ile kullanıcı ve ürün bilgilerini de çeker.
    // Pageable içindeki sıralama bilgisi (controller'dan gelen) burada sorguya uygulanacaktır.
    @Query(value = "SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product p WHERE p.id = :productId",
           countQuery = "SELECT count(r) FROM Review r WHERE r.product.id = :productId")
    Page<Review> findByProductIdWithDetails(@Param("productId") Long productId, Pageable pageable);

    // Eski findByProductIdSortedByDateDesc metodunu silebilir veya yorum satırına alabilirsiniz.
    // @Query("SELECT r FROM Review r WHERE r.product.id = :productId ORDER BY r.reviewDate DESC")
    // Page<Review> findByProductIdSortedByDateDesc(@Param("productId") Long productId, Pageable pageable);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT r.rating FROM Review r WHERE r.product.id = :productId")
    List<Integer> findRatingsByProductId(@Param("productId") Long productId);
}