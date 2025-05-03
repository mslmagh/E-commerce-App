package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CategoryDto;
import com.example.ecommerce.dto.CategoryRequestDto; // Use correct DTO name
import com.example.ecommerce.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
// Use fully qualified name for Swagger's RequestBody
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category API", description = "API endpoints for managing categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // GET All Categories
    @Operation(summary = "Get All Categories", security = {})
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Successfully retrieved list",
            content = @Content(mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = CategoryDto.class)))) })
    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        List<CategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    // GET Category by ID
    @Operation(summary = "Get Category by ID", security = {})
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryDto.class))),
        @ApiResponse(responseCode = "404", description = "Category not found", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDto> getCategoryById(@Parameter(description = "ID of category to retrieve") @PathVariable Long id) {
        CategoryDto category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

    // CREATE Category
    @Operation(summary = "Create New Category")
    @RequestBody( // Use fully qualified name for Swagger's RequestBody
        description = "Category data to create", required = true,
        content = @Content(schema = @Schema(implementation = CategoryRequestDto.class)) // Use correct DTO name
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Category created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryDto.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input or category name already exists"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @SecurityRequirement(name="bearerAuth")
    public ResponseEntity<CategoryDto> createCategory(@Valid @org.springframework.web.bind.annotation.RequestBody CategoryRequestDto requestDto) { // Use correct DTO name
        CategoryDto createdCategory = categoryService.createCategory(requestDto);
        return ResponseEntity.status(201).body(createdCategory);
    }

    // UPDATE Category
    @Operation(summary = "Update Existing Category")
    @Parameter(description = "ID of category to update", required = true)
    @RequestBody( // Use fully qualified name
        description = "Updated category data", required = true,
        content = @Content(schema = @Schema(implementation = CategoryRequestDto.class)) // Use correct DTO name
    )
    @ApiResponses(value = { /* ... responses ... */ })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name="bearerAuth")
    public ResponseEntity<CategoryDto> updateCategory(
            @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody CategoryRequestDto requestDto) { // Use correct DTO name
       CategoryDto updatedCategory = categoryService.updateCategory(id, requestDto);
       return ResponseEntity.ok(updatedCategory);
    }

    // DELETE Category
    @Operation(summary = "Delete Category by ID")
    @Parameter(description = "ID of category to delete", required = true)
    @ApiResponses(value = { /* ... responses ... */ })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name="bearerAuth")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}