package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "DTO representing a product review with product details, for user's review list")
public class UserReviewDto {

    @Schema(description = "Unique ID of the review", example = "1")
    private Long id;

    @Schema(description = "ID of the product being reviewed", example = "101")
    private Long productId;

    @Schema(description = "Name of the product being reviewed", example = "Awesome Laptop")
    private String productName;
    
    @Schema(description = "Image URL of the product being reviewed", example = "https://example.com/images/awesome-laptop.jpg")
    private String productImageUrl; // Optional, but good for UI

    @Schema(description = "ID of the user who wrote the review", example = "55")
    private Long userId;

    @Schema(description = "Username of the user who wrote the review", example = "user123")
    private String username;

    @Schema(description = "Rating given by the user (1-5)", example = "4")
    private Integer rating;

    @Schema(description = "User's comment", example = "Good value for money.")
    private String comment;

    @Schema(description = "Date and time when the review was posted")
    private LocalDateTime reviewDate;

    // Constructors
    public UserReviewDto() {}

    public UserReviewDto(Long id, Long productId, String productName, String productImageUrl, Long userId, String username, Integer rating, String comment, LocalDateTime reviewDate) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productImageUrl = productImageUrl;
        this.userId = userId;
        this.username = username;
        this.rating = rating;
        this.comment = comment;
        this.reviewDate = reviewDate;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductImageUrl() { return productImageUrl; }
    public void setProductImageUrl(String productImageUrl) { this.productImageUrl = productImageUrl; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDateTime reviewDate) { this.reviewDate = reviewDate; }
} 