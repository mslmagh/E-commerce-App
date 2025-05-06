package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for creating a new product review")
public class CreateReviewRequestDto {

    @Schema(description = "Rating given by the user (1-5)", requiredMode = Schema.RequiredMode.REQUIRED, example = "5")
    @NotNull(message = "Rating cannot be null")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Schema(description = "User's comment for the product (optional, max 1000 characters)", example = "Great product, highly recommended!")
    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String comment;

    // ProductId PathVariable veya RequestParam olarak alınacak, bu DTO'da olmasına gerek yok
    // Eğer /api/reviews gibi genel bir endpoint kullanılacaksa productId buraya eklenebilir.
    // Şimdilik /api/products/{productId}/reviews yolunu varsayarak productId'yi DTO'dan çıkarıyorum.

    // Getters and Setters
    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}