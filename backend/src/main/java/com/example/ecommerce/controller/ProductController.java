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

    // GET All Products (Optionally filtered by categoryId)
    @Operation(summary = "Get All Products",
               description = "Retrieves a list of all products. Can be filtered by categoryId.",
               security = {}) 
    @ApiResponses(value = { 
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of products",
                         content = @Content(mediaType = "application/json", 
                                 array = @ArraySchema(schema = @Schema(implementation = ProductDto.class)))) 
    })
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @Parameter(description = "Optional Category ID to filter products")
            @RequestParam(required = false) Long categoryId,
            org.springframework.security.core.Authentication authentication) {
        List<ProductDto> products;

        boolean isAdmin = false;
        if (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            isAdmin = true;
        }

        if (categoryId != null) {
            // Kategori filtresi varsa, admin olup olmamasına bakılmaksızın kategoriye göre ürünler getirilir.
            // Bu kısım daha da geliştirilebilir: admin kategoriye göre tümünü, kullanıcı sadece aktifleri.
            // Şimdilik basit tutalım: Kategori filtresi varsa, productService.getProductsByCategoryId çağırılır (bu sadece aktifleri döner).
            // Admin için kategoriye göre tüm ürünleri getiren ayrı bir servis metodu daha iyi olabilir.
            // VEYA getProductsByCategoryId(Long categoryId, boolean includeInactive) şeklinde bir parametre alabilir.
            // Şimdilik mevcut public metodu kullanalım, bu sadece aktifleri getirir.
            // TODO: Admin için kategoriye göre tüm ürünleri (aktif/pasif) getirme özelliği eklenebilir.
            products = productService.getProductsByCategoryId(categoryId); 
        } else {
            if (isAdmin) {
                products = productService.getAllProductsForAdmin(); // Admin tüm ürünleri görür
            } else {
                products = productService.getAllProducts(); // Normal kullanıcı sadece aktif ürünleri görür
            }
        }
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

    @Operation(summary = "Get Products for Current Seller",
               description = "Retrieves a list of products belonging to the currently authenticated seller.")
    @ApiResponses(value = { 
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of products for the current seller",
                         content = @Content(mediaType = "application/json", 
                                 array = @ArraySchema(schema = @Schema(implementation = ProductDto.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden, user is not a seller")
    })
    @GetMapping("/my")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<ProductDto>> getMyProducts() {
        List<ProductDto> products = productService.getProductsForCurrentSeller();
        return ResponseEntity.ok(products);
    }

    // GET Products by Seller Username
    @Operation(summary = "Get Active Products by Seller Username",
               description = "Retrieves a list of active products for a specific seller username.",
               security = {}) // Public endpoint
    @ApiResponses(value = { 
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of products",
                         content = @Content(mediaType = "application/json", 
                                 array = @ArraySchema(schema = @Schema(implementation = ProductDto.class)))),
            @ApiResponse(responseCode = "404", description = "Seller not found or seller has no active products")
    })
    @GetMapping("/by-seller/{username}")
    public ResponseEntity<List<ProductDto>> getProductsBySellerUsername(@Parameter(description = "Username of the seller") @PathVariable String username) {
        List<ProductDto> products = productService.getProductsBySellerUsername(username);
        return ResponseEntity.ok(products);
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
    @PreAuthorize("hasRole('SELLER') and @productSecurityService.isOwner(principal, #id)")
    public ResponseEntity<ProductDto> updateProduct(
            @Parameter(description = "ID of product to update") @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody ProductRequestDto requestDto) { // Use Save DTO
        ProductDto updatedProductDto = productService.updateProduct(id, requestDto);
        return ResponseEntity.ok(updatedProductDto);
    }

    // DELETE Product -> Artık Deactivate Product
    @Operation(summary = "Deactivate a Product by ID", description = "Marks a product as inactive and records a deactivation reason. Requires ADMIN role or SELLER role for their own product.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product deactivated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDto.class))),
            @ApiResponse(responseCode = "400", description = "Reason not provided or invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Product not found")})
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @productSecurityService.isOwner(principal, #id))") // Yetkilendirme aynı kalabilir, admin tümünü, satıcı kendisininkini pasife alabilir.
    public ResponseEntity<ProductDto> deactivateProduct(
            @Parameter(description = "ID of product to deactivate") @PathVariable Long id,
            @Parameter(description = "Reason for deactivation", required = true) @RequestParam String reason) {
        ProductDto deactivatedProduct = productService.deactivateProduct(id, reason);
        return ResponseEntity.ok(deactivatedProduct);
    }

    // REACTIVATE Product
    @Operation(summary = "Reactivate a Product by ID", description = "Marks a product as active. Requires ADMIN role, or SELLER role for their own product.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Product reactivated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProductDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or not authorized role)"),
            @ApiResponse(responseCode = "404", description = "Product not found")})
    @PutMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('SELLER') and @productSecurityService.isOwner(principal, #id))")
    public ResponseEntity<ProductDto> reactivateProduct(@Parameter(description = "ID of product to reactivate") @PathVariable Long id) {
        ProductDto reactivatedProduct = productService.reactivateProduct(id);
        return ResponseEntity.ok(reactivatedProduct);
    }
}