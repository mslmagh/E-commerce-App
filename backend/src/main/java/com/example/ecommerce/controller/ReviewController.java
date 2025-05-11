package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CreateReviewRequestDto;
import com.example.ecommerce.dto.ReviewDto;
import com.example.ecommerce.dto.UserReviewDto;
import com.example.ecommerce.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Product Review API", description = "API endpoints for managing product reviews and ratings")
public class ReviewController {

    private final ReviewService reviewService;

    @Autowired
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @Operation(summary = "Create a new review for a product",
               description = "Allows authenticated users (with ROLE_USER) to submit a rating and comment for a product. " +
                             "A user can typically review a product only once.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Review created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ReviewDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data (e.g., rating out of range, user already reviewed)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token is missing or invalid"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User does not have ROLE_USER"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @PostMapping("/api/products/{productId}/reviews")
    @PreAuthorize("hasRole('USER')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ReviewDto> createReview(
            @Parameter(description = "ID of the product to review", required = true) @PathVariable Long productId,
            @Valid @RequestBody CreateReviewRequestDto reviewRequestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        ReviewDto createdReview = reviewService.createReview(productId, reviewRequestDto, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReview);
    }

    @Operation(summary = "Get all reviews for a product",
               description = "Retrieves a paginated list of reviews for a specific product. Publicly accessible. Sorted by review date descending by default.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved reviews",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @GetMapping("/api/products/{productId}/reviews")
    public ResponseEntity<Page<ReviewDto>> getReviewsForProduct(
            @Parameter(description = "ID of the product whose reviews are to be retrieved", required = true) @PathVariable Long productId,
            @PageableDefault(size = 5, sort = "reviewDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Sort effectiveSort;
        Sort requestedSort = pageable.getSort();

        if (requestedSort.isSorted() &&
            requestedSort.stream().anyMatch(order -> order.getProperty().equalsIgnoreCase("string"))) {
            effectiveSort = Sort.by(Sort.Direction.DESC, "reviewDate");
        } else if (requestedSort.isUnsorted()) {
            effectiveSort = Sort.by(Sort.Direction.DESC, "reviewDate");
        } else {
            effectiveSort = requestedSort;
        }

        Pageable effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), effectiveSort);

        Page<ReviewDto> reviewsPage = reviewService.getReviewsForProduct(productId, effectivePageable);
        return ResponseEntity.ok(reviewsPage);
    }

    @Operation(summary = "Update an existing review",
               description = "Allows the original author of the review to update their rating and/or comment. Requires ROLE_USER.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Review updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ReviewDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not the author of the review"),
            @ApiResponse(responseCode = "404", description = "Review not found")
    })
    @PutMapping("/api/reviews/{reviewId}")
    @PreAuthorize("hasRole('USER')")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ReviewDto> updateReview(
            @Parameter(description = "ID of the review to update", required = true) @PathVariable Long reviewId,
            @Valid @RequestBody CreateReviewRequestDto reviewRequestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        ReviewDto updatedReview = reviewService.updateReview(reviewId, reviewRequestDto, username);
        return ResponseEntity.ok(updatedReview);
    }

    @Operation(summary = "Delete a review",
               description = "Allows the original author of the review or an ADMIN to delete a review.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Review deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - User is not the author and not an ADMIN"),
            @ApiResponse(responseCode = "404", description = "Review not found")
    })
    @DeleteMapping("/api/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Void> deleteReview(
            @Parameter(description = "ID of the review to delete", required = true) @PathVariable Long reviewId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();
        boolean isAdmin = userDetails.getAuthorities().stream()
                                  .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        reviewService.deleteReview(reviewId, username, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get all reviews for the current authenticated user",
               description = "Retrieves a paginated list of reviews written by the currently logged-in user. Sorted by review date descending.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user's reviews",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token is missing or invalid")
    })
    @GetMapping("/api/reviews/my")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Page<UserReviewDto>> getMyReviews(
            @PageableDefault(size = 10, sort = "reviewDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = ((UserDetails) authentication.getPrincipal()).getUsername();
        
        Page<UserReviewDto> myReviewsPage = reviewService.getReviewsForUser(username, pageable);
        return ResponseEntity.ok(myReviewsPage);
    }
}