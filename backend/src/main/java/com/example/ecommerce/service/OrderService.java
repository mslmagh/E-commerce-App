package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateOrderRequestDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.OrderItemDto;
import com.example.ecommerce.entity.Order;
import com.example.ecommerce.entity.OrderItem;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    // No need for OrderItemRepository injection if using CascadeType.ALL

    @Transactional // Make this transactional as it involves multiple db operations
    public OrderDto createOrder(CreateOrderRequestDto requestDto) {
        // 1. Get the currently authenticated customer
        User customer = getCurrentAuthenticatedUser();

        // 2. Create the Order entity
        Order order = new Order();
        order.setCustomer(customer);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDING"); // Initial status

        BigDecimal totalAmount = BigDecimal.ZERO;

        // 3. Create OrderItem entities from DTOs
        for (CreateOrderItemDto itemDto : requestDto.getItems()) {
            // Find the product
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            // Create OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setPriceAtPurchase(product.getPrice()); // Use current product price

            // Add item to order (this also sets the order on the item)
            order.addOrderItem(orderItem);

            // Update total amount
            totalAmount = totalAmount.add(
                    product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()))
            );
        }

        // 4. Set the total amount
        order.setTotalAmount(totalAmount);

        // 5. Save the Order (CascadeType.ALL should save OrderItems too)
        Order savedOrder = orderRepository.save(order);

        // 6. Convert to DTO and return
        return convertToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForCurrentUser() {
        User customer = getCurrentAuthenticatedUser();
        List<Order> orders = orderRepository.findByCustomerUsername(customer.getUsername());
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderByIdForCurrentUser(Long orderId) {
        User currentUser = getCurrentAuthenticatedUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Authorization check: Ensure the user owns the order OR is an admin
        // Assuming roles are correctly loaded in UserDetails (User entity)
        boolean isAdmin = currentUser.getAuthorities().stream()
                                     .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        if (!order.getCustomer().getUsername().equals(currentUser.getUsername()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }

        return convertToDto(order);
    }


    // --- Helper Methods ---

    private User getCurrentAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database: " + username));
    }

    private OrderDto convertToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems().stream()
                .map(this::convertItemToDto)
                .collect(Collectors.toList());

        return new OrderDto(
                order.getId(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCustomer().getId(),
                order.getCustomer().getUsername(),
                itemDtos
        );
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return new OrderItemDto(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                item.getPriceAtPurchase()
        );
    }
}