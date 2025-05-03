package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CategoryDto;
import com.example.ecommerce.dto.CreateCategoryRequestDto;
import com.example.ecommerce.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import PreAuthorize
import org.springframework.web.bind.annotation.*; // General web annotations

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category API", description = "API endpoints for managing categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @Operation(summary = "Get All Categories", description = "Retrieves a list of all categories.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved list",
                content = @Content(mediaType = "application/json",
                        array = @ArraySchema(schema = @Schema(implementation = CategoryDto.class))))
    })
    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    // GET by ID can be added similarly if needed

    @Operation(summary = "Create New Category", description = "Adds a new category.")
    @RequestBody(description = "Category data to create", required = true,
                 content = @Content(schema = @Schema(implementation = CreateCategoryRequestDto.class)))
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Category created successfully",
                content = @Content(mediaType = "application/json",
                        schema = @Schema(implementation = CategoryDto.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input or category name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')") // Only Admin or Seller can create categories
    public ResponseEntity<CategoryDto> createCategory(@Valid @org.springframework.web.bind.annotation.RequestBody CreateCategoryRequestDto requestDto) {
        CategoryDto createdCategory = categoryService.createCategory(requestDto);
        // Typically, we don't return a Location header for category creation, just the created object.
        return ResponseEntity.status(201).body(createdCategory);
    }

    // Add PUT and DELETE endpoints later if category management is needed
}