package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "DTO representing a category")
public class CategoryDto {
    @Schema(description = "Unique identifier of the category", example = "1")
    private Long id;

    @Schema(description = "Name of the category", example = "Electronics")
    private String name;

    // Constructors
    public CategoryDto() {}
    public CategoryDto(Long id, String name) { this.id = id; this.name = name; }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}