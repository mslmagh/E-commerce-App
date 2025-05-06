package com.example.ecommerce.repository;

import com.example.ecommerce.entity.UserFavorite; // Entity adı güncellendi
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {
    // Optional<UserFavorite> findByUserId(Long userId); // Bu da kalabilir
    Optional<UserFavorite> findByUserUsername(String username);
}