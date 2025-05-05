package com.example.ecommerce.service;

import com.example.ecommerce.dto.*; // Import all DTOs from package
import com.example.ecommerce.entity.*; // Import all Entities + OrderStatus
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication; // Import Authentication
import org.springframework.security.core.GrantedAuthority; // Import GrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Ensure this is imported

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set; // Import Set for roles/authorities

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CartService cartService;
    @Autowired private ProductService productService;

    @Transactional
    public OrderDto createOrder(CreateOrderRequestDto requestDto) {
        User customer = getCurrentAuthenticatedUserEntity();
        Cart cart = cartService.findOrCreateCartForCurrentUser();

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            logger.warn("Attempt to create order from empty cart for user {}.", customer.getUsername());
            throw new IllegalArgumentException("Cannot create order from an empty cart.");
        }
        logger.info("Creating order for user {} from cart ID {}", customer.getUsername(), cart.getId());

        Address shippingAddress = addressRepository.findById(requestDto.getShippingAddressId())
                 .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found with id: " + requestDto.getShippingAddressId()));
        if (!shippingAddress.getUser().getId().equals(customer.getId())) {
            logger.warn("User {} attempted to use address ID {} which belongs to another user.", customer.getUsername(), shippingAddress.getId());
            throw new AccessDeniedException("Shipping address does not belong to the current user.");
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setShippingAddress(shippingAddress);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> newOrderItems = new ArrayList<>();
        List<CartItem> itemsToProcess = new ArrayList<>(cart.getItems());

        for (CartItem cartItem : itemsToProcess) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            Product currentProductState = productRepository.findById(product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product with id: " + product.getId() + " not found during order creation."));

            logger.debug("Checking stock for product ID {}. Requested: {}, Available: {}", currentProductState.getId(), quantity, currentProductState.getStockQuantity());
            if (currentProductState.getStockQuantity() < quantity) {
                 throw new IllegalArgumentException("Insufficient stock during checkout for product: " + currentProductState.getName() + ". Requested: " + quantity + ", Available: " + currentProductState.getStockQuantity());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(currentProductState);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtPurchase(currentProductState.getPrice());

            newOrderItems.add(orderItem);

            BigDecimal itemTotal = currentProductState.getPrice().multiply(new BigDecimal(quantity));
            totalAmount = totalAmount.add(itemTotal);
            logger.debug("Added item: Product ID {}, Qty: {}, Price: {}, ItemTotal: {}", product.getId(), quantity, orderItem.getPriceAtPurchase(), itemTotal);
        }

        order.setTotalAmount(totalAmount);
        newOrderItems.forEach(order::addOrderItem);
        logger.info("Order calculated. Total Amount: {}, Item Count: {}", totalAmount, newOrderItems.size());

        Order savedOrder = orderRepository.save(order);
        logger.info("Order created successfully with ID: {}", savedOrder.getId());

        logger.debug("Decreasing stock for order ID: {}", savedOrder.getId());
        for (OrderItem savedItem : savedOrder.getOrderItems()) {
             try {
                 productService.decreaseStock(savedItem.getProduct().getId(), savedItem.getQuantity());
             } catch (Exception e) {
                 logger.error("CRITICAL: Failed to decrease stock for product ID {} for order ID {}. Manual correction needed! Error: {}",
                              savedItem.getProduct().getId(), savedOrder.getId(), e.getMessage(), e);
             }
        }

        logger.debug("Clearing cart ID: {} for user ID: {}", cart.getId(), customer.getId());
        try {
            cartService.clearCartForCurrentUser();
        } catch (Exception e) {
             logger.error("ERROR: Failed to clear cart for user ID {} after creating order ID {}. Error: {}",
                          customer.getId(), savedOrder.getId(), e.getMessage(), e);
        }

        logger.debug("Converting saved order ID: {} to DTO", savedOrder.getId());
        return convertToDto(savedOrder);
    }

    // ===> YENİ METOT: Sipariş İptali <===
    @Transactional
    public OrderDto cancelOrder(Long orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = getCurrentAuthenticatedUserEntity(authentication); // Get user from authentication
        Set<String> currentUserRoles = getUserRoles(authentication); // Get user roles

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        logger.info("Attempting to cancel order ID: {} by user: {}. Current status: {}",
                     orderId, currentUser.getUsername(), currentStatus);

        // Check if already cancelled
        if (currentStatus == OrderStatus.CANCELLED) {
            logger.warn("Order ID: {} is already cancelled.", orderId);
            throw new IllegalStateException("Order is already cancelled.");
        }

        boolean canCancel = false;
        boolean isOwner = order.getCustomer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUserRoles.contains("ROLE_ADMIN");
        boolean isSeller = currentUserRoles.contains("ROLE_SELLER");

        if (isAdmin) {
            // Admin can cancel anytime
            canCancel = true;
            logger.info("Admin {} cancelling order ID: {}", currentUser.getUsername(), orderId);
        } else if (isSeller) {
            // Seller can cancel anytime IF the order contains their product
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            if (orderContainsSellersProduct) {
                canCancel = true;
                logger.info("Seller {} cancelling order ID: {} (contains their product)", currentUser.getUsername(), orderId);
            } else {
                logger.warn("Seller {} attempted to cancel order ID: {} which does not contain their products.", currentUser.getUsername(), orderId);
                throw new AccessDeniedException("Seller is not authorized to cancel this order as it does not contain their products.");
            }
        } else if (isOwner) {
            // User can cancel only if status is PENDING or PREPARING
            if (currentStatus == OrderStatus.PENDING || currentStatus == OrderStatus.PREPARING) {
                canCancel = true;
                logger.info("Owner {} cancelling order ID: {} (status is {})", currentUser.getUsername(), orderId, currentStatus);
            } else {
                logger.warn("Owner {} attempted to cancel order ID: {} but status is {}.", currentUser.getUsername(), orderId, currentStatus);
                throw new IllegalStateException("Order cannot be cancelled by the owner at its current status: " + currentStatus);
            }
        }

        // If none of the above conditions met
        if (!canCancel) {
            logger.warn("User {} is not authorized to cancel order ID: {}", currentUser.getUsername(), orderId);
            throw new AccessDeniedException("User not authorized to cancel this order.");
        }

        // --- Perform Cancellation ---
        // 1. Increase stock
        logger.debug("Increasing stock for cancelled order ID: {}", orderId);
        for (OrderItem item : order.getOrderItems()) {
            try {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity());
            } catch (Exception e) {
                logger.error("CRITICAL: Failed to increase stock for product ID {} while cancelling order ID {}. Manual correction needed! Error: {}",
                             item.getProduct().getId(), orderId, e.getMessage(), e);
                // Consider how to handle this - maybe don't cancel if stock increase fails?
                // For now, we log and continue cancellation.
            }
        }

        // 2. Update order status
        order.setStatus(OrderStatus.CANCELLED);

        // 3. Save the order
        Order cancelledOrder = orderRepository.save(order);
        logger.info("Order ID: {} successfully cancelled.", orderId);

        // 4. Return updated DTO
        return convertToDto(cancelledOrder);
    }
    // ===> YENİ METOT SONU <===


    // --- Diğer OrderService Metotları ---
    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForCurrentUser() {
        User customer = getCurrentAuthenticatedUserEntity();
        List<Order> orders = orderRepository.findByCustomerUsername(customer.getUsername());
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderByIdForCurrentUser(Long orderId) {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = getUserRoles(SecurityContextHolder.getContext().getAuthentication()).contains("ROLE_ADMIN"); // Get roles

        // Allow owner OR admin to view
        if (!order.getCustomer().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }
        return convertToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForSeller() {
        User seller = getCurrentAuthenticatedUserEntity();
        // No need to check role again if controller already does, but can be added for safety
        // boolean isSeller = getUserRoles(SecurityContextHolder.getContext().getAuthentication()).contains("ROLE_SELLER");
        // if (!isSeller) { throw new AccessDeniedException("Access denied: User is not a seller."); }
        List<Order> orders = orderRepository.findOrdersContainingProductFromSeller(seller.getId());
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = getCurrentAuthenticatedUserEntity(authentication);
        Set<String> currentUserRoles = getUserRoles(authentication);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus newStatus = requestDto.getNewStatus();
        // Prevent setting CANCELLED via this method, use cancelOrder instead
        if (newStatus == OrderStatus.CANCELLED) {
             throw new IllegalArgumentException("Please use the /cancel endpoint to cancel orders.");
        }

        boolean isAdmin = currentUserRoles.contains("ROLE_ADMIN");
        boolean isSeller = currentUserRoles.contains("ROLE_SELLER");

        if (isAdmin) {
            order.setStatus(newStatus);
        } else if (isSeller) {
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            if (!orderContainsSellersProduct) {
                 throw new AccessDeniedException("Seller is not authorized to update status for this order.");
            }
            // Allow seller to set these statuses
            if (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED) {
                order.setStatus(newStatus);
            } else { // PENDING or other potentially invalid statuses for seller action
                throw new AccessDeniedException("Seller cannot set status to " + newStatus);
            }
        } else { // User is not ADMIN or relevant SELLER
            throw new AccessDeniedException("User is not authorized to update order status.");
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // --- Helper Methods ---
    // Overload or modify getCurrentAuthenticatedUserEntity to accept Authentication
    private User getCurrentAuthenticatedUserEntity() {
        return getCurrentAuthenticatedUserEntity(SecurityContextHolder.getContext().getAuthentication());
    }

    private User getCurrentAuthenticatedUserEntity(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
             throw new IllegalStateException("Cannot get user details from unauthenticated context.");
        }
        Object principal = authentication.getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            username = principal.toString();
        } else {
           throw new IllegalStateException("Cannot get username from principal: Principal is null.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
    }

    // Helper to get roles/authorities as Strings from Authentication
     private Set<String> getUserRoles(Authentication authentication) {
         if (authentication == null || !authentication.isAuthenticated()) {
             return Set.of(); // Return empty set if not authenticated
         }
         return authentication.getAuthorities().stream()
                 .map(GrantedAuthority::getAuthority)
                 .collect(Collectors.toSet());
     }

    private OrderDto convertToDto(Order order) {
         List<OrderItemDto> itemDtos = (order.getOrderItems() != null)
                                         ? order.getOrderItems().stream().map(this::convertItemToDto).collect(Collectors.toList())
                                         : new ArrayList<>();
         AddressDto shippingAddressDto = (order.getShippingAddress() != null)
                                         ? convertAddressToDto(order.getShippingAddress())
                                         : null;
        return new OrderDto(
                order.getId(), order.getOrderDate(), order.getStatus(), order.getTotalAmount(),
                order.getCustomer().getId(), order.getCustomer().getUsername(), itemDtos, shippingAddressDto, order.getStripePaymentIntentId()
        );
    }
 @Transactional // Modifies order by saving paymentIntentId
    public PaymentIntentDto createPaymentIntent(Long orderId) throws StripeException {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Authorization check: Only the order owner (or admin) can create payment intent
        boolean isAdmin = getUserRoles(SecurityContextHolder.getContext().getAuthentication()).contains("ROLE_ADMIN");
        if (!order.getCustomer().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to process payment for this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Payment cannot be initiated for order with status: " + order.getStatus());
        }

        long amountInKurus = order.getTotalAmount().multiply(new BigDecimal("100")).longValueExact();
        String currency = "try"; // Or get from config/order details

        // --- Create Stripe Payment Intent ---
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInKurus)
                .setCurrency(currency)
                // Enable automatic payment methods (recommended by Stripe)
                .setAutomaticPaymentMethods(PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
                // Add metadata (optional but useful)
                .putMetadata("order_id", order.getId().toString())
                .putMetadata("customer_username", order.getCustomer().getUsername())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        logger.info("Created PaymentIntent ID: {} for Order ID: {}", paymentIntent.getId(), orderId);

        // Save the PaymentIntent ID to the order (important for tracking/webhooks)
        order.setStripePaymentIntentId(paymentIntent.getId());
        orderRepository.save(order);

        // Return only the client secret to the frontend
        return new PaymentIntentDto(paymentIntent.getClientSecret());
    }
     private OrderItemDto convertItemToDto(OrderItem item) {
         Long productId = (item.getProduct() != null) ? item.getProduct().getId() : null;
         String productName = (item.getProduct() != null) ? item.getProduct().getName() : null;
         BigDecimal price = item.getPriceAtPurchase();
         return new OrderItemDto(productId, productName, item.getQuantity(), price);
     }

     private AddressDto convertAddressToDto(Address address) {
         if (address == null) return null;
         return new AddressDto(
                 address.getId(), address.getPhoneNumber(), address.getCountry(), address.getCity(),
                 address.getPostalCode(), address.getAddressText(),
                 (address.getUser() != null) ? address.getUser().getId() : null);
     }
}