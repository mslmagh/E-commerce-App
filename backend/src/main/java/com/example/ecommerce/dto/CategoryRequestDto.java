package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for creating or updating a category")
public class CategoryRequestDto {

    @Schema(description = "Name for the category", requiredMode = Schema.RequiredMode.REQUIRED, example = "Home Appliances")
    @NotBlank(message = "Category name cannot be blank")
    @Size(min = 2, max = 50, message = "Category name must be between 2 and 50 characters")
    private String name;

    // Getters & Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}