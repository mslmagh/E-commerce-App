package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.dto.ProductRequestDto; // Use the new combined DTO
import com.example.ecommerce.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
// Use fully qualified name for Swagger's RequestBody annotation
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*; // Use wildcard
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Product API", description = "API endpoints for managing products")
@SecurityRequirement(name = "bearerAuth") // Apply security requirement globally here if desired
public class ProductController {

    private final ProductService productService;

    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // GET All Products
    @Operation(summary = "Get All Products", security = {}) // Override global security for public endpoints
    @ApiResponses(value = { @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ProductDto.class)))) })
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        List<ProductDto> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    // GET Product by ID
    @Operation(summary = "Get Product by ID", security = {}) // Override global security for public endpoints
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Success", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDto.class))),
            @ApiResponse(responseCode = "404", description = "Product not found", content = @Content) })
    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@Parameter(description = "ID of product to retrieve") @PathVariable Long id) {
        ProductDto productDto = productService.getProductById(id);
        return ResponseEntity.ok(productDto);
    }

    // CREATE Product
    @Operation(summary = "Create a New Product")
    @RequestBody(description = "Product data to create", required = true, content = @Content(schema = @Schema(implementation = ProductRequestDto.class))) // Use Save DTO
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Product created", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")})
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    public ResponseEntity<ProductDto> createProduct(@Valid @org.springframework.web.bind.annotation.RequestBody ProductRequestDto requestDto) { // Use Save DTO
        ProductDto createdProductDto = productService.createProduct(requestDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(createdProductDto.getId()).toUri();
        return ResponseEntity.created(location).body(createdProductDto);
    }

    // UPDATE Product
    @Operation(summary = "Update an Existing Product")
    @RequestBody(description = "Updated product data", required = true, content = @Content(schema = @Schema(implementation = ProductRequestDto.class))) // Use Save DTO
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product updated", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Product not found")})
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @productSecurityService.isOwner(principal, #id))")
    public ResponseEntity<ProductDto> updateProduct(
            @Parameter(description = "ID of product to update") @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody ProductRequestDto requestDto) { // Use Save DTO
        ProductDto updatedProductDto = productService.updateProduct(id, requestDto);
        return ResponseEntity.ok(updatedProductDto);
    }

    // DELETE Product
    @Operation(summary = "Delete a Product by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Product deleted"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Product not found")})
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @productSecurityService.isOwner(principal, #id))")
    public ResponseEntity<Void> deleteProduct(@Parameter(description = "ID of product to delete") @PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}