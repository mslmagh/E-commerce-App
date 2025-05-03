package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CartDto;
import com.example.ecommerce.dto.CartItemRequestDto; // Use the combined request DTO
import com.example.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/cart") // Base path for cart operations
@Tag(name = "Shopping Cart API", description = "API endpoints for managing the user's shopping cart")
@SecurityRequirement(name = "bearerAuth") // All endpoints require authentication
@PreAuthorize("isAuthenticated()") // All endpoints require an authenticated user
public class CartController {

    @Autowired
    private CartService cartService;

    @Operation(summary = "Get Current User's Cart", description = "Retrieves the shopping cart contents for the authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cart retrieved successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = CartDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping
    public ResponseEntity<CartDto> getMyCart() {
        CartDto cart = cartService.getCartForCurrentUser();
        return ResponseEntity.ok(cart);
    }

    @Operation(summary = "Add Item to Cart", description = "Adds a product to the cart or updates its quantity if it already exists.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Item details (productId and quantity)", required = true,
                       content = @Content(schema = @Schema(implementation = CartItemRequestDto.class)))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item added/updated successfully, returns updated cart",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = CartDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or insufficient stock"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @PostMapping("/items")
    public ResponseEntity<CartDto> addItemToMyCart(@Valid @org.springframework.web.bind.annotation.RequestBody CartItemRequestDto itemDto) {
        CartDto updatedCart = cartService.addItemToCart(itemDto);
        return ResponseEntity.ok(updatedCart);
    }

    @Operation(summary = "Update Cart Item Quantity", description = "Updates the quantity of a specific item in the cart.")
    @Parameter(name = "itemId", description = "ID of the cart item to update", required = true)
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "New quantity details", required = true,
                       content = @Content(schema = @Schema(implementation = CartItemRequestDto.class))) // Note: Only quantity is usually needed, but reusing DTO
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Quantity updated successfully, returns updated cart",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = CartDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or insufficient stock"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (Item not in user's cart)"),
            @ApiResponse(responseCode = "404", description = "Cart item or Product not found")
    })
    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartDto> updateMyCartItemQuantity(
            @PathVariable Long itemId,
            @Valid @org.springframework.web.bind.annotation.RequestBody CartItemRequestDto itemDto) {
        // Reusing CartItemRequestDto, but only quantity matters here
        CartDto updatedCart = cartService.updateCartItemQuantity(itemId, itemDto);
        return ResponseEntity.ok(updatedCart);
    }


    @Operation(summary = "Remove Item from Cart", description = "Removes a specific item from the cart.")
    @Parameter(name = "itemId", description = "ID of the cart item to remove", required = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Item removed successfully, returns updated cart",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = CartDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (Item not in user's cart)"),
            @ApiResponse(responseCode = "404", description = "Cart item not found")
    })
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartDto> removeMyCartItem(@PathVariable Long itemId) {
        CartDto updatedCart = cartService.removeItemFromCart(itemId);
        return ResponseEntity.ok(updatedCart);
    }
}