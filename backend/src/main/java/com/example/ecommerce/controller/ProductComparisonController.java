package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.service.ProductComparisonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/compare")
@PreAuthorize("isAuthenticated()")
public class ProductComparisonController {
    @Autowired
    private ProductComparisonService comparisonService;

    @Operation(summary = "Get current user's comparison list")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Comparison list returned")
    })
    @GetMapping
    public ResponseEntity<List<ProductDto>> getComparisonList() {
        return ResponseEntity.ok(comparisonService.getComparisonListForCurrentUser());
    }

    @Operation(summary = "Add product to comparison list")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Product added")
    })
    @PostMapping("/{productId}")
    public ResponseEntity<Void> addProduct(@PathVariable Long productId) {
        comparisonService.addProductToComparison(productId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Remove product from comparison list")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Product removed")
    })
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeProduct(@PathVariable Long productId) {
        comparisonService.removeProductFromComparison(productId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Clear comparison list")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Comparison list cleared")
    })
    @DeleteMapping
    public ResponseEntity<Void> clearList() {
        comparisonService.clearComparisonList();
        return ResponseEntity.ok().build();
    }
} 