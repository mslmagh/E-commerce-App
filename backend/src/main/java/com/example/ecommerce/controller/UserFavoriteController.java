package com.example.ecommerce.controller;

import com.example.ecommerce.dto.UserFavoriteDto; // DTO adı güncellendi
import com.example.ecommerce.service.UserFavoriteService; // Servis adı güncellendi
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites") // Endpoint yolu güncellendi
@Tag(name = "User Favorites API", description = "API endpoints for managing user's favorite products") // Tag güncellendi
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('USER')")
public class UserFavoriteController { // Sınıf adı güncellendi

    private final UserFavoriteService userFavoriteService; // Tip güncellendi

    @Autowired
    public UserFavoriteController(UserFavoriteService userFavoriteService) { // Tip güncellendi
        this.userFavoriteService = userFavoriteService;
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserDetails)) {
            throw new IllegalStateException("User not authenticated or authentication principal is not UserDetails");
        }
        return ((UserDetails) authentication.getPrincipal()).getUsername();
    }

    @Operation(summary = "Get current user's favorite products list")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Favorites list retrieved successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserFavoriteDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping
    public ResponseEntity<UserFavoriteDto> getMyFavorites() { // Metot adı güncellendi
        UserFavoriteDto userFavoriteDto = userFavoriteService.getFavoritesForCurrentUser(getCurrentUsername()); // Metot çağrısı güncellendi
        return ResponseEntity.ok(userFavoriteDto);
    }

    @Operation(summary = "Add a product to favorites list")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product added to favorites successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserFavoriteDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @PostMapping("/products/{productId}")
    public ResponseEntity<UserFavoriteDto> addProductToMyFavorites( // Metot adı güncellendi
            @Parameter(description = "ID of the product to add", required = true) @PathVariable Long productId) {
        UserFavoriteDto updatedFavorites = userFavoriteService.addProductToFavorites(productId, getCurrentUsername()); // Metot çağrısı güncellendi
        return ResponseEntity.ok(updatedFavorites);
    }

    @Operation(summary = "Remove a product from favorites list")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product removed from favorites successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserFavoriteDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Product or Favorites list not found")
    })
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<UserFavoriteDto> removeProductFromMyFavorites( // Metot adı güncellendi
            @Parameter(description = "ID of the product to remove", required = true) @PathVariable Long productId) {
        UserFavoriteDto updatedFavorites = userFavoriteService.removeProductFromFavorites(productId, getCurrentUsername()); // Metot çağrısı güncellendi
        return ResponseEntity.ok(updatedFavorites);
    }

    @Operation(summary = "Clear the entire favorites list")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Favorites list cleared successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @DeleteMapping
    public ResponseEntity<Void> clearMyFavorites() { // Metot adı güncellendi
        userFavoriteService.clearFavorites(getCurrentUsername()); // Metot çağrısı güncellendi
        return ResponseEntity.noContent().build();
    }
}