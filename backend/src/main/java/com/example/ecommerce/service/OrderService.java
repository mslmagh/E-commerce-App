package com.example.ecommerce.service;

import com.example.ecommerce.dto.*; // Import all DTOs from package
import com.example.ecommerce.entity.*; // Import all Entities + OrderStatus
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
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
import java.util.Optional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set; // Import Set for roles/authorities

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AddressRepository addressRepository;
    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private CartService cartService;
    @Autowired
    private ProductService productService;

    @Transactional // Ensures all operations succeed or fail together
public OrderDto createOrder(CreateOrderRequestDto requestDto) { // Now takes DTO with addressId only
    // 1. Get Authenticated User
    User customer = getCurrentAuthenticatedUserEntity();
    logger.info("Initiating order creation for user: {}", customer.getUsername());

    // 2. Get User's Cart (Using CartService's internal method)
    Cart cart = cartService.findCartForCurrentUserInternal();
    if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
        logger.warn("Attempt to create order from empty or non-existent cart for user {}.", customer.getUsername());
        throw new IllegalArgumentException("Cannot create order from an empty cart.");
    }
    logger.debug("Found cart ID: {} with {} items for user {}", cart.getId(), cart.getItems().size(), customer.getUsername());

    // 3. Validate Shipping Address
    Address shippingAddress = addressRepository.findById(requestDto.getShippingAddressId())
            .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found with id: " + requestDto.getShippingAddressId()));
    // Check if the address belongs to the current user
    if (!shippingAddress.getUser().getId().equals(customer.getId())) {
        logger.warn("User {} attempted to use address ID {} which belongs to another user.", customer.getUsername(), shippingAddress.getId());
        throw new AccessDeniedException("Shipping address does not belong to the current user.");
    }
    logger.debug("Shipping address validated for order. Address ID: {}", shippingAddress.getId());

    // 4. Create Order and OrderItems (Check stock before adding)
    Order order = new Order();
    order.setCustomer(customer);
    order.setShippingAddress(shippingAddress);
    // orderDate and PENDING status are set in Order's default constructor

    BigDecimal totalAmount = BigDecimal.ZERO;
    List<CartItem> itemsInCart = new ArrayList<>(cart.getItems()); // Copy to avoid issues while iterating if cart is modified elsewhere

    for (CartItem cartItem : itemsInCart) {
        Product product = cartItem.getProduct();
        int quantity = cartItem.getQuantity();

        // Check stock availability (using ProductService helper)
        productService.checkStockAvailability(product.getId(), quantity);

        // Create OrderItem
        OrderItem orderItem = new OrderItem();
        orderItem.setProduct(product);
        orderItem.setQuantity(quantity);
        orderItem.setPriceAtPurchase(product.getPrice()); // Use current price from Product entity

        // Add item to order (sets bidirectional relationship)
        order.addOrderItem(orderItem);

        // Calculate item total and add to order total
        BigDecimal itemTotal = product.getPrice().multiply(new BigDecimal(quantity));
        totalAmount = totalAmount.add(itemTotal);
        logger.debug("Processing item for order: Product ID {}, Qty: {}, Price: {}, ItemTotal: {}", product.getId(), quantity, orderItem.getPriceAtPurchase(), itemTotal);
    }

    order.setTotalAmount(totalAmount);
    logger.info("Order calculated. Total Amount: {}, Item Count: {}", totalAmount, order.getOrderItems().size());

    // 5. Save the Order (Cascade should save OrderItems)
    Order savedOrder = orderRepository.save(order);
    logger.info("Order entity saved successfully with ID: {}", savedOrder.getId());

    // 6. Decrease Stock for each product in the order
    // This happens *after* order is saved successfully.
    logger.debug("Decreasing stock for order ID: {}", savedOrder.getId());
    for (OrderItem savedItem : savedOrder.getOrderItems()) {
        try {
            productService.decreaseStock(savedItem.getProduct().getId(), savedItem.getQuantity());
        } catch (Exception e) {
            // Log critical error if stock decrease fails after order is saved
            logger.error("CRITICAL: Failed to decrease stock for product ID {} for order ID {}. Manual correction needed! Error: {}",
                         savedItem.getProduct().getId(), savedOrder.getId(), e.getMessage(), e);
            // Depending on requirements, you might want to:
            // - Attempt rollback (complex)
            // - Mark the order for review
            // - For now, we just log the error.
        }
    }

    // 7. Clear the user's shopping cart
    logger.debug("Clearing cart ID: {} for user ID: {}", cart.getId(), customer.getId());
    try {
        // Use cartId to be certain, although findCartForCurrentUserInternal could be called again
         cartService.clearCartForCurrentUser();
    } catch (Exception e) {
        logger.error("ERROR: Failed to clear cart ID {} for user ID {} after creating order ID {}. Error: {}",
                     cart.getId(), customer.getId(), savedOrder.getId(), e.getMessage(), e);
        // Log error but proceed, order is already created.
    }

    // 8. Convert the saved Order to DTO and return
    logger.debug("Converting saved order ID: {} to DTO", savedOrder.getId());
    return convertToDto(savedOrder); // Make sure convertToDto is up-to-date
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
                logger.info("Seller {} cancelling order ID: {} (contains their product)", currentUser.getUsername(),
                        orderId);
            } else {
                logger.warn("Seller {} attempted to cancel order ID: {} which does not contain their products.",
                        currentUser.getUsername(), orderId);
                throw new AccessDeniedException(
                        "Seller is not authorized to cancel this order as it does not contain their products.");
            }
        } else if (isOwner) {
            // User can cancel only if status is PENDING or PREPARING
            if (currentStatus == OrderStatus.PENDING || currentStatus == OrderStatus.PREPARING) {
                canCancel = true;
                logger.info("Owner {} cancelling order ID: {} (status is {})", currentUser.getUsername(), orderId,
                        currentStatus);
            } else {
                logger.warn("Owner {} attempted to cancel order ID: {} but status is {}.", currentUser.getUsername(),
                        orderId, currentStatus);
                throw new IllegalStateException(
                        "Order cannot be cancelled by the owner at its current status: " + currentStatus);
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
                logger.error(
                        "CRITICAL: Failed to increase stock for product ID {} while cancelling order ID {}. Manual correction needed! Error: {}",
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

        boolean isAdmin = getUserRoles(SecurityContextHolder.getContext().getAuthentication()).contains("ROLE_ADMIN"); // Get
                                                                                                                       // roles

        // Allow owner OR admin to view
        if (!order.getCustomer().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }
        return convertToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForSeller() {
        User seller = getCurrentAuthenticatedUserEntity();
        // Rol kontrolü (Controller'daki @PreAuthorize yeterliyse kaldırılabilir)
        boolean isSeller = seller.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));
        if (!isSeller) {
            throw new AccessDeniedException("Access denied: User is not a seller.");
        }
        Long sellerId = seller.getId();

        // 1. Satıcının ürününü içeren siparişleri bul
        List<Order> orders = orderRepository.findOrdersContainingProductFromSeller(sellerId);

        // 2. Her siparişi DTO'ya çevirirken item'ları filtrele ve toplamı yeniden
        // hesapla
        return orders.stream().map(order -> { // <<<--- Lambda ifadesini geri getirdik

            // 2a. Bu siparişteki item'ları SADECE bu satıcıya ait olanlarla filtrele
            List<OrderItemDto> sellerItemDtos = order.getOrderItems().stream()
                    .filter(item -> item.getProduct() != null &&
                            item.getProduct().getSeller() != null &&
                            item.getProduct().getSeller().getId().equals(sellerId)) // Seller ID ile filtrele
                    .map(this::convertItemToDto) // Filtrelenmiş item'ları DTO'ya çevir
                    .collect(Collectors.toList());

            // 2b. Toplam tutarı SADECE filtrelenmiş item'lar üzerinden yeniden hesapla
            BigDecimal sellerTotalAmount = sellerItemDtos.stream()
                    .map(itemDto -> {
                        BigDecimal price = Optional.ofNullable(itemDto.getPriceAtPurchase()).orElse(BigDecimal.ZERO);
                        Integer quantity = Optional.ofNullable(itemDto.getQuantity()).orElse(0);
                        return price.multiply(new BigDecimal(quantity));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // 2c. OrderDto'yu filtrelenmiş item listesi ve hesaplanmış tutarla oluştur (8
            // parametre)
            // convertToDto(order.getShippingAddress()) adres çevrimini yapar.
            return new OrderDto(
                    order.getId(),
                    order.getOrderDate(),
                    order.getStatus(),
                    sellerTotalAmount, // Satıcıya özel toplam tutar
                    order.getCustomer().getId(),
                    order.getCustomer().getUsername(),
                    sellerItemDtos, // Filtrelenmiş item listesi
                    convertAddressToDto(order.getShippingAddress()) // Adres DTO'su
            );
        }).collect(Collectors.toList()); // Sonuçları List<OrderDto> olarak topla
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
            if (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.SHIPPED
                    || newStatus == OrderStatus.DELIVERED) {
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

    // Helper to convert Address Entity to AddressDto (Ensure AddressDto import
    // exists)
    private AddressDto convertAddressToDto(Address address) {
        if (address == null)
            return null;
        Long userId = (address.getUser() != null) ? address.getUser().getId() : null;
        return new AddressDto(
                address.getId(), address.getPhoneNumber(), address.getCountry(),
                address.getCity(), address.getPostalCode(), address.getAddressText(),
                userId);
    }

    // Helper to convert OrderItem Entity to OrderItemDto (Ensure OrderItemDto
    // import exists)
    private OrderItemDto convertItemToDto(OrderItem item) {
        Long productId = (item.getProduct() != null) ? item.getProduct().getId() : null;
        String productName = (item.getProduct() != null) ? item.getProduct().getName() : null;
        BigDecimal price = Optional.ofNullable(item.getPriceAtPurchase()).orElse(BigDecimal.ZERO); // Use Optional for
                                                                                                   // safety
        Integer quantity = Optional.ofNullable(item.getQuantity()).orElse(0); // Use Optional for safety
        return new OrderItemDto(productId, productName, quantity, price);
    }

    // ===> BU METODU KONTROL EDİN/DEĞİŞTİRİN <===
    // Helper to convert Order Entity to OrderDto (Handles 8-arg constructor)
    private OrderDto convertToDto(Order order) {
        if (order == null)
            return null; // Handle null order case

        // Handle potential null list
        List<OrderItemDto> itemDtos = (order.getOrderItems() == null) ? new ArrayList<>()
                : order.getOrderItems().stream()
                        .map(this::convertItemToDto)
                        .collect(Collectors.toList());

        // Convert Address Entity to Address DTO using helper
        AddressDto shippingAddressDto = convertAddressToDto(order.getShippingAddress());

        // Handle potential null customer
        Long customerId = (order.getCustomer() != null) ? order.getCustomer().getId() : null;
        String customerUsername = (order.getCustomer() != null) ? order.getCustomer().getUsername() : null;

        // Call the correct 8-argument constructor from your OrderDto.java
        return new OrderDto(
                order.getId(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(), // Use the totalAmount stored in the Order entity
                customerId,
                customerUsername,
                itemDtos,
                shippingAddressDto // Pass the converted AddressDto
        );
    }
}