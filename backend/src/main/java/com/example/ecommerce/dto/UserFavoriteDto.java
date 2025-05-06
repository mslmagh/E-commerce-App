package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "DTO representing a user's favorite products list")
public class UserFavoriteDto {

    @Schema(description = "Unique ID of the favorites list", example = "1")
    private Long id;

    @Schema(description = "ID of the user this favorites list belongs to", example = "55")
    private Long userId;

    @Schema(description = "List of favorite products")
    private List<ProductDto> products; // ProductDto kullanılacak

    @Schema(description = "Date and time when the favorites list was created")
    private LocalDateTime createdDate;

    @Schema(description = "Date and time when the favorites list was last modified")
    private LocalDateTime lastModifiedDate;

    public UserFavoriteDto() {}

    public UserFavoriteDto(Long id, Long userId, List<ProductDto> products, LocalDateTime createdDate, LocalDateTime lastModifiedDate) {
        this.id = id;
        this.userId = userId;
        this.products = products;
        this.createdDate = createdDate;
        this.lastModifiedDate = lastModifiedDate;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public List<ProductDto> getProducts() { return products; }
    public void setProducts(List<ProductDto> products) { this.products = products; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public LocalDateTime getLastModifiedDate() { return lastModifiedDate; }
    public void setLastModifiedDate(LocalDateTime lastModifiedDate) { this.lastModifiedDate = lastModifiedDate; }
}