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
import java.util.ArrayList; // Import ArrayList
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;

    // --- Core Cart Logic ---

    public CartDto getCartForCurrentUser() {
        Cart cart = findOrCreateCartForCurrentUser();
        return convertCartToDto(cart);
    }

    @Transactional
    public CartDto addItemToCart(CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser();
        Product product = findProductById(itemDto.getProductId());

        int requestedQuantity = itemDto.getQuantity();
        Optional<CartItem> existingItemOptional = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        CartItem itemToSave;
        if (existingItemOptional.isPresent()) {
            itemToSave = existingItemOptional.get();
            int newQuantity = itemToSave.getQuantity() + requestedQuantity;
            logger.debug("Updating quantity for product ID {} in cart ID {}. Old: {}, Adding: {}, New: {}",
                         product.getId(), cart.getId(), itemToSave.getQuantity(), requestedQuantity, newQuantity);
            checkStockAvailability(product, newQuantity); // Check total needed quantity
            itemToSave.setQuantity(newQuantity);
        } else {
            logger.debug("Adding new product ID {} to cart ID {}. Quantity: {}",
                         product.getId(), cart.getId(), requestedQuantity);
            checkStockAvailability(product, requestedQuantity); // Check needed quantity
            itemToSave = new CartItem();
            itemToSave.setProduct(product);
            itemToSave.setQuantity(requestedQuantity);
            cart.addItem(itemToSave); // Sets both sides of relationship
        }

        cart.setLastUpdated(LocalDateTime.now());
        // Cascade should save the new/updated item when cart is saved
        Cart updatedCart = cartRepository.save(cart);
        logger.info("Item added/updated for product ID {} in cart ID {}.", product.getId(), cart.getId());
        return convertCartToDto(updatedCart);
    }

    @Transactional
    public CartDto updateCartItemQuantity(Long cartItemId, CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser(); // Get user's cart
        CartItem cartItem = findCartItemById(cartItemId);
        checkCartOwnership(cart, cartItem); // Ensure item is in the correct cart

        Product product = cartItem.getProduct();
        int newQuantity = itemDto.getQuantity();
        logger.debug("Updating quantity for cart item ID {} to {}. Product ID: {}", cartItemId, newQuantity, product.getId());

        if (newQuantity < 1) {
             throw new IllegalArgumentException("Quantity must be at least 1.");
        }

        checkStockAvailability(product, newQuantity); // Check stock for the new quantity

        cartItem.setQuantity(newQuantity);
        cart.setLastUpdated(LocalDateTime.now());

        cartItemRepository.save(cartItem); // Save the updated item
        Cart updatedCart = cartRepository.save(cart); // Update cart timestamp
        logger.info("Quantity updated for cart item ID {}.", cartItemId);
        return convertCartToDto(updatedCart);
    }


    @Transactional
    public CartDto removeItemFromCart(Long cartItemId) {
        Cart cart = findOrCreateCartForCurrentUser();
        CartItem cartItem = findCartItemById(cartItemId);
        checkCartOwnership(cart, cartItem);

        logger.debug("Removing cart item ID {} (Product ID: {}) from cart ID {}.",
                     cartItemId, cartItem.getProduct().getId(), cart.getId());

        // Use orphanRemoval=true - just remove from collection
        boolean removed = cart.getItems().removeIf(item -> item.getId().equals(cartItemId));
        // Alternatively: cartItemRepository.delete(cartItem);

        if (removed) {
            cart.setLastUpdated(LocalDateTime.now());
            Cart updatedCart = cartRepository.save(cart);
            logger.info("Removed cart item ID {}.", cartItemId);
            return convertCartToDto(updatedCart);
        } else {
             logger.warn("Cart item ID {} not found in cart ID {} during removal attempt.", cartItemId, cart.getId());
             // Should ideally not happen if checkCartOwnership passed, but good to handle
             return convertCartToDto(cart); // Return current cart state
        }
    }

    @Transactional
    public void clearCartForCurrentUser() {
        Cart cart = findOrCreateCartForCurrentUser();
        logger.debug("Clearing cart for user ID: {}, Cart ID: {}", cart.getUser().getId(), cart.getId());
        // Option 1: Using orphanRemoval=true
        if (cart.getItems() != null && !cart.getItems().isEmpty()) {
             // Clear the collection in memory. JPA/Hibernate will detect removed orphans
             // during the flush/commit phase if orphanRemoval=true.
             cart.getItems().clear();
             cart.setLastUpdated(LocalDateTime.now());
             cartRepository.save(cart); // Saving the cart triggers the removal of orphans
             logger.info("Cart cleared for user ID: {}", cart.getUser().getId());
        } else {
             logger.debug("Cart was already empty for user ID: {}", cart.getUser().getId());
        }

        // Option 2: Direct deletion (use if orphanRemoval=false or for certainty)
        /*
        if (cart.getItems() != null && !cart.getItems().isEmpty()) {
            logger.debug("Deleting {} items directly from repository for cart ID: {}", cart.getItems().size(), cart.getId());
            cartItemRepository.deleteAllInBatch(cart.getItems()); // Efficient batch delete
            cart.getItems().clear(); // Clear the collection in memory
            cart.setLastUpdated(LocalDateTime.now());
            cartRepository.save(cart);
            logger.info("Cart cleared for user ID: {}", cart.getUser().getId());
        } else {
             logger.debug("Cart was already empty for user ID: {}", cart.getUser().getId());
        }
        */
    }


    // --- Helper Methods ---

    private User getCurrentAuthenticatedUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            username = principal.toString();
        }
         else {
            throw new IllegalStateException("Cannot get username from anonymous or unauthenticated user.");
        }
        return userRepository.findByUsername(username)
                 .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
     }

    public Cart findOrCreateCartForCurrentUser() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        return cartRepository.findByUserId(currentUser.getId()).orElseGet(() -> {
            logger.info("No cart found for user ID: {}. Creating a new cart.", currentUser.getId());
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
         // Check both ways for robustness
         if (!cartItem.getCart().getId().equals(cart.getId()) || !cart.getItems().contains(cartItem) ) {
             logger.warn("Ownership check failed: Cart item ID {} does not belong to cart ID {}", cartItem.getId(), cart.getId());
             throw new AccessDeniedException("Cart item does not belong to the current user's cart.");
         }
     }

    private void checkStockAvailability(Product product, int requestedQuantity) {
         if (product.getStockQuantity() < requestedQuantity) {
             logger.warn("Insufficient stock for product ID: {}. Requested: {}, Available: {}",
                         product.getId(), requestedQuantity, product.getStockQuantity());
             throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                                                ". Requested: " + requestedQuantity +
                                                ", Available: " + product.getStockQuantity());
         }
    }

    // --- DTO Conversion ---

    private CartDto convertCartToDto(Cart cart) {
        List<CartItemDto> itemDtos = (cart.getItems() != null)
                                        ? cart.getItems().stream()
                                           .map(this::convertCartItemToDto)
                                           .collect(Collectors.toList())
                                        : new ArrayList<>();

        // grandTotal burada hesaplanıyor, constructor'a gönderilmiyor!
        BigDecimal grandTotal = itemDtos.stream()
                                  .map(CartItemDto::getTotalPrice)
                                  .filter(java.util.Objects::nonNull)
                                  .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ===> DOĞRU CONSTRUCTOR ÇAĞRISI (3 parametre) <===
        return new CartDto(
                cart.getId(),
                cart.getUser().getId(),
                itemDtos
                // grandTotal buraya parametre olarak GEÇİRİLMEYECEK!
        );
   }

    private CartItemDto convertCartItemToDto(CartItem cartItem) {
        Product product = cartItem.getProduct();
        Long productId = (product != null) ? product.getId() : null;
        String productName = (product != null) ? product.getName() : null;
        BigDecimal unitPrice = (product != null && product.getPrice() != null) ? product.getPrice() : BigDecimal.ZERO;

         return new CartItemDto(
                cartItem.getId(),
                productId,
                productName,
                cartItem.getQuantity(),
                unitPrice);
    }
}