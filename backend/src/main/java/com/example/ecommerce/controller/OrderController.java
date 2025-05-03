package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CreateOrderRequestDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.UpdateOrderStatusRequestDto; // Import status DTO
import com.example.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody; // Use fully qualified name below
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
@RequestMapping("/api/orders")
@Tag(name = "Order API", description = "API endpoints for managing customer orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Operation(summary = "Create a new order", description = "Creates an order based on the items provided. Requires USER role.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Order details", required = true,
                        content = @Content(schema = @Schema(implementation = CreateOrderRequestDto.class)))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order created successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or product not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (User does not have ROLE_USER)")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER')") // Only USERs can create orders
    public ResponseEntity<OrderDto> createOrder(@Valid @org.springframework.web.bind.annotation.RequestBody CreateOrderRequestDto requestDto) {
        OrderDto createdOrder = orderService.createOrder(requestDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(createdOrder.getId()).toUri();
        return ResponseEntity.created(location).body(createdOrder);
    }

    @Operation(summary = "Get My Orders", description = "Retrieves all orders placed by the currently authenticated user.")
    @ApiResponses(value = { /* ... */ }) // Keep ApiResponses
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        List<OrderDto> orders = orderService.getOrdersForCurrentUser();
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get Orders for Seller's Products", description = "Retrieves orders containing products sold by the currently authenticated seller.")
    @ApiResponses(value = { /* ... */ }) // Keep ApiResponses
    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<List<OrderDto>> getOrdersForMyProducts() {
        List<OrderDto> orders = orderService.getOrdersForSeller();
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get Order by ID", description = "Retrieves a specific order by its ID. Accessible only by the owner or an admin.")
    @Parameter(description = "ID of the order to retrieve", required = true)
    @ApiResponses(value = { /* ... */ }) // Keep ApiResponses
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id) {
        // Authorization check is done in the service
        OrderDto order = orderService.getOrderByIdForCurrentUser(id);
        return ResponseEntity.ok(order);
    }

    @Operation(summary = "Update Order Status", description = "Updates the status of a specific order. Requires ADMIN or SELLER role (seller must own a product in the order).")
    @Parameter(description = "ID of the order to update", required = true)
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "New status for the order", required = true,
                    content = @Content(schema = @Schema(implementation = UpdateOrderStatusRequestDto.class)))
    @ApiResponses(value = { /* ... */ }) // Keep ApiResponses
    @PatchMapping("/{id}/status") // Use PATCH for partial update (status only)
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long id,
            @Valid @org.springframework.web.bind.annotation.RequestBody UpdateOrderStatusRequestDto requestDto) {
        OrderDto updatedOrder = orderService.updateOrderStatus(id, requestDto);
        return ResponseEntity.ok(updatedOrder);
    }
}