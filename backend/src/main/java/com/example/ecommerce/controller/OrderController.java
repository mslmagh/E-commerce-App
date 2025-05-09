package com.example.ecommerce.controller;

import com.example.ecommerce.dto.*;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.service.OrderService;
import com.stripe.exception.StripeException;
import org.springframework.security.access.AccessDeniedException;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Order API", description = "API endpoints for managing customer orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

        @Autowired
        private OrderService orderService;

        private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

        private String getCurrentUsername() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()
                                || !(authentication.getPrincipal() instanceof UserDetails)) {
                        throw new IllegalStateException(
                                        "User not authenticated or authentication principal is not UserDetails");
                }
                return ((UserDetails) authentication.getPrincipal()).getUsername();

        }

        // POST /api/orders
        @Operation(summary = "Create a new order from cart", description = "Creates an order based on items in the user's cart, using the specified shipping address ID. Requires USER role.")
        @RequestBody(description = "Request containing the ID of the shipping address to use", required = true, content = @Content(schema = @Schema(implementation = CreateOrderRequestDto.class)))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Order created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid input (e.g., empty cart, invalid address ID, insufficient stock)", content = @Content),
                        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content),
                        @ApiResponse(responseCode = "403", description = "Forbidden (User is not ROLE_USER or address doesn't belong to user)", content = @Content),
                        @ApiResponse(responseCode = "404", description = "Shipping address or Product not found", content = @Content) })
        @PostMapping
        @PreAuthorize("hasAuthority('ROLE_USER')")
        public ResponseEntity<OrderDto> createOrder(
                        @Valid @org.springframework.web.bind.annotation.RequestBody CreateOrderRequestDto requestDto) {
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

        @Operation(summary = "Cancel an Entire Order (Admin/Owner)", description = "Admins can cancel any order (full refund if applicable). Owners can cancel their PENDING/PREPARING orders (no refund via this endpoint).")
        @ApiResponses(value = {
        // ... (uygun response'lar) ...
        })
        @PostMapping("/{id}/cancel") // Veya /full-cancel
        @PreAuthorize("hasRole('ADMIN') or isAuthenticated()") // Admin veya sipariş sahibi (servis katmanında detaylı
                                                               // kontrol)
        public ResponseEntity<OrderDto> cancelEntireOrder(
                        @PathVariable Long id,
                        @RequestParam(required = false) String reason // Opsiyonel iptal nedeni
        ) {
                String username = getCurrentUsername();
                OrderDto cancelledOrder = orderService.cancelFullOrder(id, username, reason);
                return ResponseEntity.ok(cancelledOrder);
        }

        @Operation(summary = "Cancel/Refund Specific Order Items (Admin/Seller)", description = "Allows an Admin to cancel/refund any items, or a Seller to cancel/refund their own items in an order. Processes refunds via Stripe if applicable.")
        @RequestBody(description = "Request containing OrderItem IDs to cancel and optional reason", required = true, content = @Content(schema = @Schema(implementation = CancelOrderItemsRequestDto.class)))
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Selected items processed for cancellation/refund", content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderDto.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid input (e.g., no item IDs, invalid item IDs)"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden (e.g., seller trying to cancel other seller's items)"),
                        @ApiResponse(responseCode = "404", description = "Order or OrderItem not found"),
                        @ApiResponse(responseCode = "500", description = "Refund processing error")
        })
        @PostMapping("/{orderId}/items/cancel-refund")
        @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
        public ResponseEntity<OrderDto> cancelRefundOrderItems(
                        @PathVariable Long orderId,
                        @Valid @org.springframework.web.bind.annotation.RequestBody CancelOrderItemsRequestDto requestDto) {
                String username = getCurrentUsername();
                OrderDto updatedOrder = orderService.cancelAndRefundOrderItemsByActor(orderId, requestDto, username);
                return ResponseEntity.ok(updatedOrder);
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

        @Operation(summary = "Create Stripe Payment Intent")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Payment Intent created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = PaymentIntentDto.class))),
                        @ApiResponse(responseCode = "401", description = "Unauthorized"),
                        @ApiResponse(responseCode = "403", description = "Forbidden (User does not own the order/not admin)"),
                        @ApiResponse(responseCode = "404", description = "Order not found"),
                        @ApiResponse(responseCode = "409", description = "Conflict (Payment cannot be initiated for order state)"), // Example
                                                                                                                                    // for
                                                                                                                                    // IllegalStateException
                        @ApiResponse(responseCode = "500", description = "Stripe or Internal server error")
        })
        @PostMapping("/{id}/create-payment-intent")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<?> createPaymentIntentForOrder(@PathVariable Long id) {
                try {
                        PaymentIntentDto paymentIntentDto = orderService.createPaymentIntent(id);
                        return ResponseEntity.ok(paymentIntentDto);
                } catch (StripeException e) {
                        logger.error("Stripe error creating PaymentIntent for order {}: {}", id, e.getMessage());
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body("Error communicating with payment provider: " + e.getMessage());
                }
                // === DÜZELTİLMİŞ CATCH BLOKLARI ===
                catch (ResourceNotFoundException e) {
                        logger.warn("Failed to create payment intent for order {}: {}", id, e.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage()); // Return 404
                } catch (AccessDeniedException e) {
                        logger.warn("Failed to create payment intent for order {}: {}", id, e.getMessage());
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage()); // Return 403
                } catch (IllegalStateException e) {
                        logger.warn("Failed to create payment intent for order {}: {}", id, e.getMessage());
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage()); // Return 409
                }
                // === DÜZELTME SONU ===
                catch (Exception e) { // Diğer beklenmedik hatalar
                        logger.error("Unexpected error creating PaymentIntent for order {}: {}", id, e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body("An unexpected error occurred.");
                }
        }

}