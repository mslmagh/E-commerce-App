package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "DTO for creating a new category")
public class CreateCategoryRequestDto {

    @Schema(description = "Name for the new category", requiredMode = Schema.RequiredMode.REQUIRED, example = "Books")
    @NotBlank(message = "Category name cannot be blank")
    @Size(min = 2, max = 50, message = "Category name must be between 2 and 50 characters")
    private String name;

    // Getters & Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}