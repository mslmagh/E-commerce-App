package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateOrderRequestDto;
import com.example.ecommerce.dto.CreateOrderItemDto;
import com.example.ecommerce.dto.OrderDto;
import com.example.ecommerce.dto.OrderItemDto;
import com.example.ecommerce.dto.UpdateOrderStatusRequestDto; // Import new DTO
import com.example.ecommerce.entity.*; // Import all entities + OrderStatus
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
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;

    @Transactional
    public OrderDto createOrder(CreateOrderRequestDto requestDto) {
        User customer = getCurrentAuthenticatedUser();

        Order order = new Order();
        order.setCustomer(customer);
        // orderDate and status are set in default constructor now

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderItemDto itemDto : requestDto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDto.getProductId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.getQuantity());

            BigDecimal priceFromProduct = product.getPrice();
            // If product price is BigDecimal: BigDecimal priceFromProduct = product.getPrice();
            orderItem.setPriceAtPurchase(priceFromProduct);

            order.addOrderItem(orderItem);

            BigDecimal quantityBigDecimal = new BigDecimal(itemDto.getQuantity());
            totalAmount = totalAmount.add(priceFromProduct.multiply(quantityBigDecimal));
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);
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

        boolean isAdmin = currentUser.getAuthorities().stream()
                                     .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!order.getCustomer().getUsername().equals(currentUser.getUsername()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }

        return convertToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForSeller() {
        User seller = getCurrentAuthenticatedUser();
        boolean isSeller = seller.getAuthorities().stream()
                                  .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));
        // Also allow Admin to use this potentially? Or create separate endpoint for Admin?
        // For now, strict SELLER check as per endpoint definition
        if (!isSeller) {
             throw new AccessDeniedException("Access denied: User is not a seller.");
        }

        List<Order> orders = orderRepository.findOrdersContainingProductFromSeller(seller.getId());
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }


    @Transactional
    public OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequestDto requestDto) {
        User currentUser = getCurrentAuthenticatedUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus newStatus = requestDto.getNewStatus();

        boolean isAdmin = currentUser.getAuthorities().stream()
                                     .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isSeller = currentUser.getAuthorities().stream()
                                      .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));

        if (isAdmin) {
             // Admin can set any status including CANCELLED
             if (newStatus == OrderStatus.CANCELLED) {
                 // Add logic for cancellation (e.g., restock, refund trigger) if needed
                 System.out.println("Admin cancelling order: " + orderId);
             }
             order.setStatus(newStatus);
        } else if (isSeller) {
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));

            if (!orderContainsSellersProduct) {
                 throw new AccessDeniedException("Seller is not authorized to update status for this order (no products belong to seller).");
            }

            // Seller specific allowed statuses
            if (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED) {
                order.setStatus(newStatus);
            } else {
                throw new AccessDeniedException("Seller cannot set status to " + newStatus);
            }
        } else {
            // Other roles cannot update status
            throw new AccessDeniedException("User is not authorized to update order status.");
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }


    // --- Helper Methods ---

    private User getCurrentAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
             // This case might occur for anonymous users if security allows access somehow,
             // or if the principal is not a UserDetails object unexpectedly.
             // Throwing an exception or handling appropriately is needed.
            throw new IllegalStateException("Cannot get username from principal: " + principal);
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
    }

    private OrderDto convertToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems().stream()
                .map(this::convertItemToDto)
                .collect(Collectors.toList());

        return new OrderDto(
                order.getId(),
                order.getOrderDate(),
                order.getStatus(), // Use Enum
                order.getTotalAmount(),
                order.getCustomer().getId(),
                order.getCustomer().getUsername(),
                itemDtos
        );
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        // Handle potential NullPointerException if product is null (shouldn't happen with DB constraints)
        Long productId = (item.getProduct() != null) ? item.getProduct().getId() : null;
        String productName = (item.getProduct() != null) ? item.getProduct().getName() : null;

        return new OrderItemDto(
                productId,
                productName,
                item.getQuantity(),
                item.getPriceAtPurchase()
        );
    }
}