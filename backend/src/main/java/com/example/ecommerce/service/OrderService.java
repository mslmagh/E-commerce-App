package com.example.ecommerce.service;

import com.example.ecommerce.dto.*; // Import all DTOs from package
import com.example.ecommerce.entity.*; // Import all Entities + OrderStatus
import com.example.ecommerce.service.CartService;
import com.example.ecommerce.service.ProductService;
import com.example.ecommerce.entity.Cart;
import com.example.ecommerce.entity.CartItem;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AddressRepository addressRepository;
    @Autowired private CartRepository cartRepository; // Still needed maybe? Or let CartService handle all? Let's keep for now.
    @Autowired private CartService cartService;         // Inject CartService
    @Autowired private ProductService productService;    // Inject ProductService

    @Transactional
    public OrderDto createOrder(CreateOrderRequestDto requestDto) { // Takes DTO with addressId
        // 1. Get the current authenticated user
        User customer = getCurrentAuthenticatedUserEntity();

        // ===> DEĞİŞİKLİK: Find OR CREATE Cart using CartService <===
        // Cart cart = cartRepository.findByUserId(customer.getId()) // Eski yöntem
        //         .orElseThrow(() -> {
        //             logger.warn("Attempt to create order for user {} without a cart.", customer.getUsername());
        //             return new ResourceNotFoundException("Shopping cart not found for user: " + customer.getUsername());
        //          });
        Cart cart = cartService.findOrCreateCartForCurrentUser(); // Yeni Yöntem (Sepet yoksa oluşturur)
        // ===> DEĞİŞİKLİK SONU <===

        // Check if the cart (found or created) is empty
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            logger.warn("Attempt to create order from empty cart for user {}.", customer.getUsername());
            throw new IllegalArgumentException("Cannot create order from an empty cart."); // Bu hata 400 Bad Request döndürmeli
        }
        logger.info("Creating order for user {} from cart ID {}", customer.getUsername(), cart.getId());

        // 2. Get Shipping Address and verify ownership
        Address shippingAddress = addressRepository.findById(requestDto.getShippingAddressId())
                 .orElseThrow(() -> new ResourceNotFoundException("Shipping address not found with id: " + requestDto.getShippingAddressId()));
        if (!shippingAddress.getUser().getId().equals(customer.getId())) {
            logger.warn("User {} attempted to use address ID {} which belongs to another user.", customer.getUsername(), shippingAddress.getId());
            throw new AccessDeniedException("Shipping address does not belong to the current user.");
        }

        // 3. Create Order entity
        Order order = new Order();
        order.setCustomer(customer);
        order.setShippingAddress(shippingAddress);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> newOrderItems = new ArrayList<>();

        // 4. Process items, check stock (re-check here!), create OrderItems
        logger.debug("Processing {} items from cart ID {}", cart.getItems().size(), cart.getId());
        // Create a copy to avoid issues if clearing the cart affects iteration
        List<CartItem> itemsToProcess = new ArrayList<>(cart.getItems());
        for (CartItem cartItem : itemsToProcess) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            Product currentProductState = productRepository.findById(product.getId()) // Re-fetch product for fresh stock info
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

            BigDecimal itemTotal = currentProductState.getPrice().multiply(new BigDecimal(quantity)); // Use BigDecimal constructor for quantity
            totalAmount = totalAmount.add(itemTotal);
            logger.debug("Added item: Product ID {}, Qty: {}, Price: {}, ItemTotal: {}", product.getId(), quantity, orderItem.getPriceAtPurchase(), itemTotal);
        }

        // 5. Set total amount and add items to the order
        order.setTotalAmount(totalAmount);
        newOrderItems.forEach(order::addOrderItem);
        logger.info("Order calculated. Total Amount: {}, Item Count: {}", totalAmount, newOrderItems.size());

        // 6. Save Order
        Order savedOrder = orderRepository.save(order);
        logger.info("Order created successfully with ID: {}", savedOrder.getId());

        // 7. Decrease Stock
        logger.debug("Decreasing stock for order ID: {}", savedOrder.getId());
        for (OrderItem savedItem : savedOrder.getOrderItems()) {
             try {
                 productService.decreaseStock(savedItem.getProduct().getId(), savedItem.getQuantity());
             } catch (Exception e) {
                 logger.error("CRITICAL: Failed to decrease stock for product ID {} for order ID {}. Manual correction needed! Error: {}",
                              savedItem.getProduct().getId(), savedOrder.getId(), e.getMessage(), e);
             }
        }

        // 8. Clear the user's shopping cart
        logger.debug("Clearing cart ID: {} for user ID: {}", cart.getId(), customer.getId());
        try {
            cartService.clearCartForCurrentUser();
        } catch (Exception e) {
             logger.error("ERROR: Failed to clear cart for user ID {} after creating order ID {}. Error: {}",
                          customer.getId(), savedOrder.getId(), e.getMessage(), e);
        }

        // 9. Convert to DTO and return
        logger.debug("Converting saved order ID: {} to DTO", savedOrder.getId());
        return convertToDto(savedOrder);
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

        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!order.getCustomer().getUsername().equals(currentUser.getUsername()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }
        return convertToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForSeller() {
        User seller = getCurrentAuthenticatedUserEntity();
        boolean isSeller = seller.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));
        if (!isSeller) {
             throw new AccessDeniedException("Access denied: User is not a seller.");
        }
        List<Order> orders = orderRepository.findOrdersContainingProductFromSeller(seller.getId());
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequestDto requestDto) {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus newStatus = requestDto.getNewStatus();
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isSeller = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));

        // ... (Authorization logic remains the same) ...
        if (isAdmin) {
             if (newStatus == OrderStatus.CANCELLED) { System.out.println("Admin cancelling order: " + orderId); }
             order.setStatus(newStatus);
        } else if (isSeller) {
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            if (!orderContainsSellersProduct) {
                 throw new AccessDeniedException("Seller is not authorized to update status for this order.");
            }
            if (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED) {
                order.setStatus(newStatus);
            } else {
                throw new AccessDeniedException("Seller cannot set status to " + newStatus);
            }
        } else {
            throw new AccessDeniedException("User is not authorized to update order status.");
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // --- Helper Methods ---
    private User getCurrentAuthenticatedUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            username = principal.toString();
        } else {
           throw new IllegalStateException("Cannot get username from principal: Authentication is null.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
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
                order.getCustomer().getId(), order.getCustomer().getUsername(), itemDtos, shippingAddressDto);
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