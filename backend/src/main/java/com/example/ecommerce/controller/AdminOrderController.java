package com.example.ecommerce.controller;

import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.UpdateOrderStatusRequestDto;
import com.example.ecommerce.entity.OrderStatus;
import com.example.ecommerce.service.OrderService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/orders")
@Tag(name = "Admin: Order Management", description = "API endpoints for administrators to manage all orders")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')") // Controller seviyesinde ADMIN yetkisi
public class AdminOrderController {

    private final OrderService orderService;

    @Autowired
    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "List all orders with filters and pagination",
               description = "Retrieves a paginated list of all orders. Admins can filter by customer username, order status, and date range. Requires ADMIN role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of orders",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Page.class))) // Page<OrderDto> dönecek
    })
    @GetMapping
    public ResponseEntity<Page<OrderDto>> getAllOrders(
            @PageableDefault(size = 10, sort = "orderDate,desc") Pageable pageable,
            @Parameter(description = "Filter by customer username (partial match, case-insensitive)", example = "johndoe")
            @RequestParam(required = false) String customerUsername,
            @Parameter(description = "Filter by order status", example = "PENDING")
            @RequestParam(required = false) OrderStatus status,
            @Parameter(description = "Filter by start date (inclusive, format: YYYY-MM-DD)", example = "2024-01-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Filter by end date (inclusive, format: YYYY-MM-DD)", example = "2024-12-31")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Page<OrderDto> ordersPage = orderService.getAllOrdersForAdmin(pageable, customerUsername, status, startDate, endDate);
        return ResponseEntity.ok(ordersPage);
    }

    @Operation(summary = "Get order details by ID for Admin",
               description = "Retrieves all details for a specific order by its ID. Requires ADMIN role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved order details",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getOrderDetails(
            @Parameter(description = "ID of the order to retrieve", required = true) @PathVariable Long orderId) {
        OrderDto orderDto = orderService.getOrderDetailsForAdmin(orderId);
        return ResponseEntity.ok(orderDto);
    }

    @Operation(summary = "Update order status by Admin",
               description = "Updates the status of a specific order. Requires ADMIN role. " +
                             "To cancel an order, use the specific cancel endpoint in the main OrderController if available for admins or implement a dedicated admin cancel.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order status updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request (e.g., invalid status, trying to cancel via this endpoint)"),
            @ApiResponse(responseCode = "404", description = "Order not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., trying to change status of a CANCELED order)")
    })
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @Parameter(description = "ID of the order to update", required = true) @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequestDto statusUpdateRequestDto) {
        OrderDto updatedOrder = orderService.updateOrderStatusByAdmin(orderId, statusUpdateRequestDto);
        return ResponseEntity.ok(updatedOrder);
    }
}