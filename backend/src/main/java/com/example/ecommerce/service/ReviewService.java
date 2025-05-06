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
import org.springframework.data.domain.PageRequest; // PageRequest import edildi
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort; // Sort import edildi
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(requestDto.getRating());
        review.setComment(requestDto.getComment());

        Review savedReview;
        try {
            savedReview = reviewRepository.save(review);
            logger.info("User {} created review ID {} for product ID {}", username, savedReview.getId(), productId);
        } catch (DataIntegrityViolationException e) {
            logger.warn("Data integrity violation for User {} reviewing product {}. Might be duplicate review.", username, productId, e);
            throw new IllegalArgumentException("You might have already submitted a review for this product.");
        }

        updateProductRatingStats(product);
        return convertToDtoSafe(savedReview);
    }

    @Transactional(readOnly = true)
    public Page<ReviewDto> getReviewsForProduct(Long productId, Pageable pageableFromController) { // Parametre adı netlik için değiştirildi
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }

        // Controller'dan gelen Pageable loglanır (debug için)
        logger.debug("Incoming Pageable from controller for product ID {}: {}", productId, pageableFromController);

        // --- YENİ EKLENEN KISIM: Sıralamayı Servis Katmanında Zorlama ---
        // Controller'dan gelen sıralama ne olursa olsun, burada her zaman "reviewDate DESC" kullanılacak.
        Sort forcedSort = Sort.by(Sort.Direction.DESC, "reviewDate");
        Pageable serviceLayerPageable = PageRequest.of(
                pageableFromController.getPageNumber(),
                pageableFromController.getPageSize(),
                forcedSort
        );
        // Servis katmanında kullanılacak Pageable loglanır (debug için)
        logger.debug("Pageable being used by service for product ID {}: {}", productId, serviceLayerPageable);
        // --- YENİ EKLENEN KISIM SONU ---

        // Güncellenmiş `serviceLayerPageable` repository metoduna gönderilir.
        Page<Review> reviewsPage = reviewRepository.findByProductIdWithDetails(productId, serviceLayerPageable);


        logger.debug("Found {} reviews for product ID {}. Page number: {}, Page size: {}, Sort: {}",
                     reviewsPage.getTotalElements(), productId, reviewsPage.getNumber(), reviewsPage.getSize(), reviewsPage.getSort());

        return reviewsPage.map(this::convertToDtoSafe);
    }

    @Transactional
    public void deleteReview(Long reviewId, String username, boolean isAdmin) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!isAdmin && !review.getUser().getId().equals(currentUser.getId())) {
            logger.warn("User {} attempted to delete review ID {} owned by user ID {}", username, reviewId, review.getUser().getId());
            throw new AccessDeniedException("You are not authorized to delete this review.");
        }

        Product product = review.getProduct();
        if (product == null) {
             logger.warn("Review ID {} has no associated product, cannot update stats after deletion.", reviewId);
        }

        reviewRepository.delete(review);
        logger.info("Review ID {} deleted by user {} (isAdmin: {})", reviewId, username, isAdmin);

        if (product != null) {
             updateProductRatingStats(product);
        }
    }

    @Transactional
    public ReviewDto updateReview(Long reviewId, CreateReviewRequestDto requestDto, String username) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!review.getUser().getId().equals(currentUser.getId())) {
            logger.warn("User {} attempted to update review ID {} owned by user ID {}", username, reviewId, review.getUser().getId());
            throw new AccessDeniedException("You are not authorized to update this review.");
        }

        review.setRating(requestDto.getRating());
        review.setComment(requestDto.getComment());
        review.setReviewDate(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);
        logger.info("Review ID {} updated by user {}", reviewId, username);

        if (updatedReview.getProduct() != null) {
             updateProductRatingStats(updatedReview.getProduct());
        } else {
             logger.warn("Updated Review ID {} has no associated product, cannot update stats.", updatedReview.getId());
        }

        return convertToDtoSafe(updatedReview);
    }


    private void updateProductRatingStats(Product product) {
        if (product == null) {
            logger.warn("Attempted to update rating stats for a null product.");
            return;
        }
        Long productId = product.getId();
        if (productId == null) {
            logger.error("Attempted to update rating stats for a product with null ID.");
            return;
        }

        List<Integer> ratings = reviewRepository.findRatingsByProductId(productId);
        BigDecimal newAverageRating;
        int newReviewCount = ratings.size();

        if (ratings.isEmpty()) {
            newAverageRating = BigDecimal.ZERO.setScale(2);
            logger.debug("Product ID {} has no reviews. Stats reset.", productId);
        } else {
            double average = ratings.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            newAverageRating = BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP);
            logger.debug("Calculated stats for product ID {}: AvgRating={}, ReviewCount={}", productId, newAverageRating, newReviewCount);
        }

        product.setAverageRating(newAverageRating);
        product.setReviewCount(newReviewCount);

        try {
            productRepository.save(product);
            logger.info("Successfully updated rating stats for product ID {}", productId);
        } catch (Exception e) {
            logger.error("Failed to save updated rating stats for product ID {}: {}", productId, e.getMessage(), e);
        }
    }

    private ReviewDto convertToDtoSafe(Review review) {
        if (review == null) {
            logger.error("Cannot convert null Review to ReviewDto.");
            // Boş bir DTO döndürmek yerine null döndürmek veya bir hata fırlatmak daha uygun olabilir,
            // ancak mevcut yapıyı koruyalım.
            return new ReviewDto();
        }

        Long pId = null;
        if (review.getProduct() != null) {
            pId = review.getProduct().getId();
        } else {
            logger.warn("Review ID {} has a null Product association.", review.getId());
        }

        Long uId = null;
        String uName = null;
        if (review.getUser() != null) {
            uId = review.getUser().getId();
            uName = review.getUser().getUsername(); // UserDetails'den gelen getUsername() değil, User entity'sindeki getUsername()
            if (uName == null) {
                logger.warn("User associated with Review ID {} has a null username.", review.getId());
            }
        } else {
            logger.warn("Review ID {} has a null User association.", review.getId());
        }
        return new ReviewDto(
                review.getId(),
                pId,
                uId,
                uName,
                review.getRating(),
                review.getComment(),
                review.getReviewDate()
        );
    }
}