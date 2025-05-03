package com.example.ecommerce.controller;

import com.example.ecommerce.dto.CreateOrderRequestDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@SecurityRequirement(name = "bearerAuth") // Indicate that endpoints here generally require bearer auth
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Operation(summary = "Create a new order", description = "Creates an order based on the items provided.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Order details", required = true,
                        content = @Content(schema = @Schema(implementation = CreateOrderRequestDto.class)))
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order created successfully",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data or product not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    @PreAuthorize("isAuthenticated()") // Any authenticated user can create an order
    public ResponseEntity<OrderDto> createOrder(@Valid @RequestBody CreateOrderRequestDto requestDto) {
        OrderDto createdOrder = orderService.createOrder(requestDto);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(createdOrder.getId()).toUri();
        return ResponseEntity.created(location).body(createdOrder);
    }

    @Operation(summary = "Get My Orders", description = "Retrieves all orders placed by the currently authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved orders",
                         content = @Content(mediaType = "application/json",
                                 array = @ArraySchema(schema = @Schema(implementation = OrderDto.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()") // Any authenticated user can get their own orders
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        List<OrderDto> orders = orderService.getOrdersForCurrentUser();
        return ResponseEntity.ok(orders);
    }

    @Operation(summary = "Get Order by ID", description = "Retrieves a specific order by its ID. Accessible only by the owner or an admin.")
    @Parameter(description = "ID of the order to retrieve", required = true)
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved the order",
                         content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (User does not own the order and is not admin)"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()") // Authorization logic is handled within the service method here
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long id) {
        OrderDto order = orderService.getOrderByIdForCurrentUser(id);
        return ResponseEntity.ok(order);
    }

    // Add endpoints for cancelling orders (by seller/admin), updating status (by seller/admin) later
}