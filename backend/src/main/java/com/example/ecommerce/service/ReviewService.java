package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateReviewRequestDto;
import com.example.ecommerce.dto.ReviewDto;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.Review;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ReviewRepository;
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReviewDto createReview(Long productId, CreateReviewRequestDto requestDto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        // Kullanıcının bu ürüne daha önce yorum yapıp yapmadığını kontrol et (opsiyonel kural)
        // Review entity'sindeki @UniqueConstraint(columnNames = {"product_id", "user_id"}) bunu DB seviyesinde sağlar.
        // DB seviyesindeki kısıtlama DataIntegrityViolationException fırlatır.
        // İsterseniz burada manuel kontrol de ekleyebilirsiniz:
        // if (reviewRepository.findByProductIdAndUserId(productId, user.getId()).isPresent()) {
        //    throw new IllegalArgumentException("User has already reviewed this product.");
        // }

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(requestDto.getRating());
        review.setComment(requestDto.getComment());
        // review.setReviewDate() zaten constructor'da set ediliyor.

        Review savedReview;
        try {
            savedReview = reviewRepository.save(review);
        } catch (DataIntegrityViolationException e) {
            // Unique constraint ihlali (kullanıcı bu ürüne zaten yorum yapmış)
            logger.warn("User {} already reviewed product {}. Or other integrity violation.", username, productId);
            throw new IllegalArgumentException("You have already submitted a review for this product, or there was an integrity issue.");
        }


        // Ürünün ortalama puanını ve yorum sayısını güncelle
        updateProductRatingStats(product);

        logger.info("User {} created review for product ID {}", username, productId);
        return convertToDto(savedReview);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getReviewsForProduct(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        Page<Review> reviewsPage = reviewRepository.findByProductId(productId, pageable);
        return reviewsPage.map(this::convertToDto);
    }

    @Transactional
    public void deleteReview(Long reviewId, String username, boolean isAdmin) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to delete this review.");
        }

        Product product = review.getProduct(); // Puan güncellemesi için ürünü al
        reviewRepository.delete(review);
        logger.info("Review ID {} deleted by user {} (isAdmin: {})", reviewId, username, isAdmin);

        // Ürünün ortalama puanını ve yorum sayısını güncelle
        updateProductRatingStats(product);
    }

    @Transactional
    public ReviewDto updateReview(Long reviewId, CreateReviewRequestDto requestDto, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(currentUser.getId())) {
            // Sadece yorum sahibi güncelleyebilir, admin için ayrı bir metot/kontrol gerekebilir
            throw new AccessDeniedException("You are not authorized to update this review.");
        }

        review.setRating(requestDto.getRating());
        review.setComment(requestDto.getComment());
        review.setReviewDate(LocalDateTime.now()); // Güncelleme tarihini de set et

        Review updatedReview = reviewRepository.save(review);
        logger.info("Review ID {} updated by user {}", reviewId, username);

        // Ürünün ortalama puanını ve yorum sayısını güncelle
        updateProductRatingStats(review.getProduct());

        return convertToDto(updatedReview);
    }

    // Ürünün ortalama puanını ve yorum sayısını güncelleyen yardımcı metot
    private void updateProductRatingStats(Product product) {
        if (product == null) return;

        List<Integer> ratings = reviewRepository.findRatingsByProductId(product.getId());
        if (ratings.isEmpty()) {
            product.setAverageRating(0.0);
            product.setReviewCount(0);
        } else {
            double average = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            // Ortalama puanı iki ondalık basamağa yuvarla
            double roundedAverage = Math.round(average * 100.0) / 100.0;
            product.setAverageRating(roundedAverage);
            product.setReviewCount(ratings.size());
        }
        productRepository.save(product);
        logger.debug("Updated rating stats for product ID {}: AvgRating={}, ReviewCount={}",
                     product.getId(), product.getAverageRating(), product.getReviewCount());
    }


    private ReviewDto convertToDto(Review review) {
        return new ReviewDto(
                review.getId(),
                review.getProduct().getId(),
                review.getUser().getId(),
                review.getUser().getUsername(),
                review.getRating(),
                review.getComment(),
                review.getReviewDate()
        );
    }
}