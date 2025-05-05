package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Order API", description = "API endpoints for managing customer orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // POST /api/orders
    @Operation(summary = "Create a new order from cart", description = "Creates an order using items from the user's current cart and the selected shipping address. Requires USER role.")
    // Update RequestBody description in Swagger
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Request containing the ID of the selected shipping address", required = true,
                        content = @Content(schema = @Schema(implementation = CreateOrderRequestDto.class))) // DTO only has addressId now
                        @ApiResponses(value = {
                                @ApiResponse(responseCode = "201", description = "Order created successfully", // Açıklama eklendi
                                             content = @Content(mediaType = "application/json",
                                                     schema = @Schema(implementation = OrderDto.class))), // İçerik tanımı eklendi
                                @ApiResponse(responseCode = "400", description = "Invalid input data, empty cart, insufficient stock, or address not found/owned", content = @Content), // 400 için @Content yeterli
                                @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content), // 401 için @Content yeterli
                                @ApiResponse(responseCode = "403", description = "Forbidden (User does not have ROLE_USER)", content = @Content) // 403 için @Content yeterli
                        })
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderDto> createOrder(@Valid @org.springframework.web.bind.annotation.RequestBody CreateOrderRequestDto requestDto) { // DTO now only contains addressId
        OrderDto createdOrder = orderService.createOrder(requestDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(createdOrder.getId()).toUri();
        return ResponseEntity.created(location).body(createdOrder);
    }

    // GET /api/orders/my-orders
    @Operation(summary = "Get My Orders", description = "Retrieves all orders placed by the currently authenticated user.") // Corrected
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved orders", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = OrderDto.class)))), // Corrected
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content) })
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        List<OrderDto> orders = orderService.getOrdersForCurrentUser();
        return ResponseEntity.ok(orders);
    }

    // GET /api/orders/seller
    @Operation(summary = "Get Orders for Seller's Products", description = "Retrieves orders containing products sold by the currently authenticated seller.") // Corrected
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved orders", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = OrderDto.class)))), // Corrected
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden (User is not a SELLER)", content = @Content) })
    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<OrderDto>> getOrdersForMyProducts() {
        List<OrderDto> orders = orderService.getOrdersForSeller();
        return ResponseEntity.ok(orders);
    }

    // GET /api/orders/{id}
    @Operation(summary = "Get Order by ID", description = "Retrieves a specific order by its ID. Accessible only by the owner or an admin.") // Corrected
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved the order", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))), // Corrected
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden (User does not own the order and is not admin)", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content) })
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id) {
        OrderDto order = orderService.getOrderByIdForCurrentUser(id);
        return ResponseEntity.ok(order);
    }

    // PATCH /api/orders/{id}/status
    @Operation(summary = "Update Order Status (Admin/Seller)", description = "Updates the status of a specific order (excludes cancellation). Requires ADMIN or SELLER role (seller must own a product in the order). Use /cancel endpoint for cancellations.") // Corrected
    @RequestBody(description = "New status for the order", required = true, content = @Content(schema = @Schema(implementation = UpdateOrderStatusRequestDto.class)))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order status updated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))), // Corrected
            @ApiResponse(responseCode = "400", description = "Invalid input data (e.g., invalid status)", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden (User not authorized to update status)", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content) })
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody UpdateOrderStatusRequestDto requestDto) {
        OrderDto updatedOrder = orderService.updateOrderStatus(id, requestDto);
        return ResponseEntity.ok(updatedOrder);
    }

     // POST /api/orders/{id}/cancel
     @Operation(summary = "Cancel an Order", description = "Cancels a specific order. Users can cancel their own PENDING/PREPARING orders. Sellers can cancel orders with their products anytime. Admins can cancel any order anytime. Stock will be replenished.") // Corrected
     @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order successfully cancelled", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))), // Corrected
            @ApiResponse(responseCode = "400", description = "Bad Request (e.g., order already cancelled, cannot be cancelled by user due to status)", content = @Content),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
            @ApiResponse(responseCode = "403", description = "Forbidden (User not authorized to cancel this order)", content = @Content),
            @ApiResponse(responseCode = "404", description = "Order not found", content = @Content) })
     @PostMapping("/{id}/cancel")
     @PreAuthorize("isAuthenticated()")
     public ResponseEntity<OrderDto> cancelOrder(@PathVariable Long id) {
         OrderDto cancelledOrder = orderService.cancelOrder(id);
         return ResponseEntity.ok(cancelledOrder);
     }
}