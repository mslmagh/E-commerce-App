package com.example.ecommerce.controller;

import io.swagger.v3.oas.annotations.Parameter; // Import Parameter annotation
import org.springframework.web.bind.annotation.PathVariable; // Import PathVariable annotation
import com.example.ecommerce.dto.ProductDto; // Import ProductDto
import com.example.ecommerce.service.ProductService; // Import ProductService
import com.example.ecommerce.dto.UpdateProductRequestDto; // Import update DTO
import io.swagger.v3.oas.annotations.Operation; // Import Swagger annotations
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity; // Import ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping; // Import PutMapping
import org.springframework.web.bind.annotation.DeleteMapping; // Import DeleteMapping
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.example.ecommerce.dto.CreateProductRequestDto; // Import the request DTO
import jakarta.validation.Valid; // Import @Valid for validation
import org.springframework.web.servlet.support.ServletUriComponentsBuilder; // To build the location URI
import java.util.List; // Import List
import java.net.URI;
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

    @Operation(summary = "Get Product by ID", description = "Retrieves a specific product by its unique ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved the product",
                    content = { @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ProductDto.class)) }), // Returns ProductDto on success
            @ApiResponse(responseCode = "404", description = "Product not found with the specified ID",
                    content = @Content) // Content can be empty or a simple string from GlobalExceptionHandler
    })
    @GetMapping("/{id}") // Handles GET requests like /api/products/1, /api/products/2 etc.
    public ResponseEntity<ProductDto> getProductById(
            @Parameter(description = "ID of the product to retrieve", required = true, example = "1") // Swagger parameter description
            @PathVariable Long id // Extracts the 'id' value from the URL path
    ) {
        // Call the service method to get the product DTO by ID
        // If the product is not found, ProductService will throw ResourceNotFoundException,
        // which will be caught by GlobalExceptionHandler to return 404.
        ProductDto productDto = productService.getProductById(id);
        // If found, return the DTO with HTTP 200 OK status
        return ResponseEntity.ok(productDto);
    }
    @Operation(summary = "Create a New Product", description = "Adds a new product to the catalog.")
    // Describe the request body for Swagger
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Product data to create", required = true,
            content = @Content(schema = @Schema(implementation = CreateProductRequestDto.class)))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Product created successfully",
                    content = { @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ProductDto.class)) }), // Returns the created ProductDto
            @ApiResponse(responseCode = "400", description = "Invalid input data provided (validation failed)",
                    content = @Content), // Body might contain validation errors (handled by Spring Boot default or GlobalExceptionHandler)
            @ApiResponse(responseCode = "500", description = "Internal server error",
                    content = @Content)
    })
    @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
    @PostMapping // Handles POST requests to /api/products
    public ResponseEntity<ProductDto> createProduct(
            @Valid // Enables validation on the request DTO based on annotations (@NotBlank etc.)
            @RequestBody // Binds the incoming request JSON body to the DTO object
            CreateProductRequestDto requestDto
    ) {
        // 1. Call the service to create the product and get the resulting DTO (with ID)
        ProductDto createdProductDto = productService.createProduct(requestDto);

        // 2. Build the URI for the 'Location' header of the response.
        //    This tells the client where to find the newly created resource.
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest() // Start from the current request path (/api/products)
                .path("/{id}") // Append /{id}
                .buildAndExpand(createdProductDto.getId()) // Replace {id} with the actual ID
                .toUri(); // Convert to URI object

        // 3. Return HTTP 201 Created status, Location header, and the created product DTO in the body
        return ResponseEntity.created(location).body(createdProductDto);
    }

        @Operation(summary = "Update an Existing Product", description = "Updates the details of a product specified by its ID.")
        //@Parameter(description = "ID of the product to update", required = true, example = "1")
        @io.swagger.v3.oas.annotations.parameters.RequestBody( // Use fully qualified name for Swagger's RequestBody
                description = "Updated product data", required = true,
                content = @Content(schema = @Schema(implementation = UpdateProductRequestDto.class)))
        @ApiResponses(value = {
                @ApiResponse(responseCode = "200", description = "Product updated successfully",
                        content = { @Content(mediaType = "application/json",
                                schema = @Schema(implementation = ProductDto.class)) }), // Returns updated ProductDto
                @ApiResponse(responseCode = "400", description = "Invalid input data provided", content = @Content),
                @ApiResponse(responseCode = "404", description = "Product not found with the specified ID", content = @Content),
                @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
        })
        @PreAuthorize("hasRole('ADMIN') or hasRole('SELLER')")
        @PutMapping("/{id}") // Handles PUT requests to /api/products/{id}
        public ResponseEntity<ProductDto> updateProduct(
                @PathVariable Long id,
                 @RequestBody UpdateProductRequestDto requestDto // Use Spring's RequestBody here
        ) {
            ProductDto updatedProductDto = productService.updateProduct(id, requestDto);
            return ResponseEntity.ok(updatedProductDto);
        }

        @Operation(summary = "Delete a Product by ID", description = "Deletes a specific product by its unique ID.")
        //@Parameter(description = "ID of the product to delete", required = true, example = "1")
        @ApiResponses(value = {
                @ApiResponse(responseCode = "204", description = "Product deleted successfully",
                        content = @Content), // No content for 204 response
                @ApiResponse(responseCode = "404", description = "Product not found with the specified ID",
                        content = @Content), // Content handled by GlobalExceptionHandler
                @ApiResponse(responseCode = "500", description = "Internal server error",
                        content = @Content)
        })
        @PreAuthorize("hasRole('ADMIN')")
        @DeleteMapping("/{id}") // Handles DELETE requests to /api/products/{id}
        public ResponseEntity<Void> deleteProduct(
                @PathVariable Long id // Extracts the 'id' value from the URL path
        ) {
            // Call the service to delete the product.
            // If the product doesn't exist, the service will throw ResourceNotFoundException,
            // which GlobalExceptionHandler will turn into a 404 response.
            productService.deleteProduct(id);
    
            // If deletion is successful (no exception thrown), return HTTP 204 No Content.
            // This is the standard practice for successful DELETE operations.
            return ResponseEntity.noContent().build();
        }
}