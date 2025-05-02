package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ProductDto; // Import ProductDto
import com.example.ecommerce.service.ProductService; // Import ProductService
import io.swagger.v3.oas.annotations.Operation; // Import Swagger annotations
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // Import ResponseEntity
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List; // Import List

@RestController // Marks this class as a REST controller
@RequestMapping("/api/products") // Base path for all endpoints in this controller
@Tag(name = "Product API", description = "API endpoints for managing products") // Swagger UI tag
public class ProductController {

    private final ProductService productService; // Service dependency

    // Constructor injection for the service
    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "Get All Products", description = "Retrieves a list of all available products.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of products",
                    content = { @Content(mediaType = "application/json",
                            // Specify that the response is an array of ProductDto objects
                            array = @ArraySchema(schema = @Schema(implementation = ProductDto.class))) }),
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content)
    })
    @GetMapping // Handles GET requests to /api/products
    public ResponseEntity<List<ProductDto>> getAllProducts() {
        // Call the service method to get all product DTOs
        List<ProductDto> products = productService.getAllProducts();
        // Return the list with an HTTP 200 OK status
        return ResponseEntity.ok(products);
    }

    // Add other endpoints here later (e.g., GET /api/products/{id}, POST /api/products, etc.)
}