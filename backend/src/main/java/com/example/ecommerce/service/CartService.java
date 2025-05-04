package com.example.ecommerce.service;

import com.example.ecommerce.dto.CartDto;
import com.example.ecommerce.dto.CartItemDto;
import com.example.ecommerce.dto.CartItemRequestDto;
import com.example.ecommerce.entity.Cart;
import com.example.ecommerce.entity.CartItem;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CartItemRepository;
import com.example.ecommerce.repository.CartRepository;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;

    // --- Core Cart Logic ---

    @Transactional
    public CartDto getCartForCurrentUser() {
        Cart cart = findOrCreateCartForCurrentUser();
        return convertCartToDto(cart);
    }

    @Transactional
    public CartDto addItemToCart(CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser();
        Product product = findProductById(itemDto.getProductId());

        // Check available stock BEFORE adding/updating
        int requestedQuantity = itemDto.getQuantity();
        Optional<CartItem> existingItemOptional = cartItemRepository.findByCartIdAndProductId(cart.getId(),
                product.getId());

        if (existingItemOptional.isPresent()) {
            // Item already exists, update quantity
            CartItem existingItem = existingItemOptional.get();
            int newQuantity = existingItem.getQuantity() + requestedQuantity;
            checkStockAvailability(product, newQuantity); // Check total needed quantity
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem); // Save updated item explicitly
        } else {
            // Item does not exist, add new item
            checkStockAvailability(product, requestedQuantity); // Check needed quantity
            CartItem newItem = new CartItem();
            newItem.setProduct(product);
            newItem.setQuantity(requestedQuantity);
            cart.addItem(newItem); // This sets cart on item too
            // Cascade should save the new item when cart is saved/flushed
        }

        cart.setLastUpdated(LocalDateTime.now());
        Cart updatedCart = cartRepository.save(cart); // Save cart to update timestamp and potentially cascade new item
                                                      // save
        return convertCartToDto(updatedCart);
    }

    @Transactional
    public CartDto updateCartItemQuantity(Long cartItemId, CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser();
        CartItem cartItem = findCartItemById(cartItemId);
        checkCartOwnership(cart, cartItem); // Ensure item belongs to user's cart

        Product product = cartItem.getProduct(); // Product doesn't change on quantity update
        int newQuantity = itemDto.getQuantity(); // Use the quantity from request DTO

        checkStockAvailability(product, newQuantity); // Check stock for the new quantity

        cartItem.setQuantity(newQuantity);
        cart.setLastUpdated(LocalDateTime.now());

        cartItemRepository.save(cartItem); // Explicitly save the item
        Cart updatedCart = cartRepository.save(cart); // Update cart timestamp

        return convertCartToDto(updatedCart);
    }

    @Transactional
    public CartDto removeItemFromCart(Long cartItemId) {
        Cart cart = findOrCreateCartForCurrentUser();
        CartItem cartItem = findCartItemById(cartItemId);
        checkCartOwnership(cart, cartItem);

        // Using orphanRemoval=true on Cart entity's items list
        // simply removing it from the collection should trigger deletion.
        // Alternatively, use cartItemRepository.delete(cartItem);
        cart.removeItem(cartItem); // Let orphanRemoval handle deletion

        cart.setLastUpdated(LocalDateTime.now());
        Cart updatedCart = cartRepository.save(cart);
        return convertCartToDto(updatedCart);
    }

    // --- Helper Methods ---

    private User getCurrentAuthenticatedUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
    }

    private Cart findOrCreateCartForCurrentUser() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        // Find existing cart or create a new one if it doesn't exist
        return cartRepository.findByUserId(currentUser.getId()).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(currentUser);
            return cartRepository.save(newCart);
        });
    }

    private Product findProductById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
    }

    private CartItem findCartItemById(Long cartItemId) {
        return cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));
    }

    private void checkCartOwnership(Cart cart, CartItem cartItem) {
        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new AccessDeniedException("Cart item does not belong to the current user's cart.");
        }
    }

    private void checkStockAvailability(Product product, int requestedQuantity) {
        if (product.getStockQuantity() < requestedQuantity) {
            throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                    ". Requested: " + requestedQuantity +
                    ", Available: " + product.getStockQuantity());
        }
    }

    // --- DTO Conversion ---

    private CartDto convertCartToDto(Cart cart) {
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(this::convertCartItemToDto)
                .collect(Collectors.toList());

        // Recalculate grand total based on DTOs to be safe
        BigDecimal grandTotal = itemDtos.stream()
                .map(CartItemDto::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartDto(
                cart.getId(),
                cart.getUser().getId(),
                itemDtos);
    }

    private CartItemDto convertCartItemToDto(CartItem cartItem) {
        Product product = cartItem.getProduct(); // Assumes product is loaded (Lazy fetch should work in Tx)
        // Handle potential NullPointerException if product somehow becomes null
        Long productId = (product != null) ? product.getId() : null;
        String productName = (product != null) ? product.getName() : null;
        BigDecimal unitPrice = (product != null) ? product.getPrice() : BigDecimal.ZERO; // Use current price

        return new CartItemDto(
                cartItem.getId(),
                productId,
                productName,
                cartItem.getQuantity(),
                unitPrice);
    }
}