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
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    // Use constructor injection (Recommended)
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Autowired
    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }


    // --- Core Cart Logic ---

    @Transactional // Needs to be writable because it might create a cart
    public CartDto getCartForCurrentUser() {
        Cart cart = findOrCreateCartForCurrentUser();
        return convertCartToDto(cart);
    }

    @Transactional
    public CartDto addItemToCart(CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser();
        Product product = findProductById(itemDto.getProductId());
        int requestedQuantity = itemDto.getQuantity();

        // Find existing item in cart for this product
        Optional<CartItem> existingItemOptional = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst();
        // Alternative using repository (might be less efficient if cart items are already loaded):
        // Optional<CartItem> existingItemOptional = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());


        if (existingItemOptional.isPresent()) {
            // Item exists, update quantity
            CartItem existingItem = existingItemOptional.get();
            int newQuantity = existingItem.getQuantity() + requestedQuantity;
            logger.debug("Updating quantity for product ID {} in cart ID {}. Old: {}, Adding: {}, New: {}",
                         product.getId(), cart.getId(), existingItem.getQuantity(), requestedQuantity, newQuantity);
            checkStockAvailability(product, newQuantity); // Check total needed quantity
            existingItem.setQuantity(newQuantity);
            // No need to call save on item if CascadeType.ALL is on Cart.items and Cart is saved
        } else {
            // Item does not exist, add new item
            logger.debug("Adding new product ID {} to cart ID {}. Quantity: {}",
                         product.getId(), cart.getId(), requestedQuantity);
            checkStockAvailability(product, requestedQuantity); // Check needed quantity
            CartItem newItem = new CartItem();
            newItem.setProduct(product);
            newItem.setQuantity(requestedQuantity);
            // newItem.setCart(cart); // This happens in cart.addItem
            cart.addItem(newItem); // Add item using helper method in Cart entity
        }

        cart.setLastUpdated(LocalDateTime.now());
        Cart updatedCart = cartRepository.save(cart); // Save cart to update timestamp and cascade item changes
        logger.info("Item added/updated for product ID {} in cart ID {}.", product.getId(), updatedCart.getId());
        return convertCartToDto(updatedCart); // Convert the LATEST state of the cart
    }

    @Transactional
    public CartDto updateCartItemQuantity(Long cartItemId, CartItemRequestDto itemDto) {
        Cart cart = findOrCreateCartForCurrentUser();
        CartItem cartItem = findCartItemById(cartItemId);
        checkCartOwnership(cart, cartItem);

        Product product = cartItem.getProduct();
        int newQuantity = itemDto.getQuantity();
         logger.debug("Updating quantity for cart item ID {} to {}. Product ID: {}", cartItemId, newQuantity, product.getId());

        if (newQuantity < 1) {
            // If quantity is less than 1, remove the item instead
             logger.debug("Quantity is less than 1, removing item ID {}", cartItemId);
             return removeItemFromCart(cartItemId);
             // throw new IllegalArgumentException("Quantity must be at least 1. To remove item, use DELETE endpoint.");
        }

        checkStockAvailability(product, newQuantity); // Check stock for the new quantity

        cartItem.setQuantity(newQuantity);
        cart.setLastUpdated(LocalDateTime.now());
        // Since CartItem is managed, saving the Cart might be enough if cascades are set correctly,
        // but saving the item explicitly is safer.
        cartItemRepository.save(cartItem);
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
                     cartItemId, (cartItem.getProduct() != null ? cartItem.getProduct().getId() : "N/A"), cart.getId());

        // Using orphanRemoval=true should handle deletion when removed from collection
        boolean removed = cart.getItems().removeIf(item -> item.getId().equals(cartItemId));

        if (removed) {
            cart.setLastUpdated(LocalDateTime.now());
            Cart updatedCart = cartRepository.save(cart); // Save cart to trigger orphan removal
            logger.info("Removed cart item ID {}.", cartItemId);
            return convertCartToDto(updatedCart);
        } else {
            logger.warn("Cart item ID {} not found in cart's item collection (ID {}) during removal attempt.", cartItemId, cart.getId());
            // This case shouldn't really happen if findCartItemById and checkCartOwnership worked
             return convertCartToDto(cart); // Return current cart state
        }
    }

    @Transactional
    public void clearCartForCurrentUser() {
         Cart cart = findCartForCurrentUserInternal(); // Use internal helper
         if (cart != null) {
            logger.debug("Clearing cart for user ID: {}, Cart ID: {}", cart.getUser().getId(), cart.getId());
            // Option 1: Using orphanRemoval=true
             if (cart.getItems() != null && !cart.getItems().isEmpty()) {
                  // Clear the collection in memory. JPA handles orphans on flush.
                  cart.getItems().clear();
                  cart.setLastUpdated(LocalDateTime.now());
                  cartRepository.save(cart); // Saving triggers orphan removal
                  logger.info("Cart cleared for user ID: {}", cart.getUser().getId());
             } else {
                  logger.debug("Cart was already empty for user ID: {}", cart.getUser().getId());
             }
         } else {
             logger.warn("No cart found for current user to clear.");
         }
    }


    // --- Helper Methods ---

    // Renamed from findOrCreate to make purpose clear for internal use
    // Returns null if no cart exists, doesn't create one here.
    @Transactional(readOnly = true) // This helper should be read-only
    protected Cart findCartForCurrentUserInternal() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        return cartRepository.findByUserId(currentUser.getId()).orElse(null);
    }

    // Finds or CREATES cart - used by external facing methods
    @Transactional // Writable transaction needed here
    protected Cart findOrCreateCartForCurrentUser() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        return cartRepository.findByUserId(currentUser.getId()).orElseGet(() -> {
            logger.info("No cart found for user ID: {}. Creating a new cart.", currentUser.getId());
            Cart newCart = new Cart();
            newCart.setUser(currentUser);
            return cartRepository.save(newCart);
        });
    }


    private User getCurrentAuthenticatedUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
             // Might happen with some pre-authentication scenarios, handle appropriately
             logger.warn("Principal is not UserDetails: {}", principal.getClass());
            username = principal.toString();
        } else {
            throw new IllegalStateException("Cannot get username from null principal.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
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
         // Check if cartItem has a cart associated and if its ID matches the user's cart ID
         if (cartItem.getCart() == null || !cartItem.getCart().getId().equals(cart.getId())) {
             logger.warn("Ownership check failed: Cart item ID {} (Cart ID: {}) does not belong to user's cart ID {}",
                         cartItem.getId(), (cartItem.getCart() != null ? cartItem.getCart().getId() : "null"), cart.getId());
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
         logger.debug("Stock check passed for Product ID: {} (Requested: {}, Available: {})",
                      product.getId(), requestedQuantity, product.getStockQuantity());
    }

    // --- DTO Conversion ---

    private CartDto convertCartToDto(Cart cart) {
         List<CartItemDto> itemDtos = (cart.getItems() != null)
                                        ? cart.getItems().stream()
                                            .map(this::convertCartItemToDto)
                                            .collect(Collectors.toList())
                                        : new ArrayList<>();

        BigDecimal grandTotal = itemDtos.stream()
                                      .map(CartItemDto::getTotalPrice)
                                      .filter(java.util.Objects::nonNull) // Add null check for safety
                                      .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Ensure user is not null before getting ID
        Long userId = (cart.getUser() != null) ? cart.getUser().getId() : null;

        return new CartDto(
                cart.getId(),
                userId,
                itemDtos
                // grandTotal is calculated within the CartDto constructor now
        );
   }

    private CartItemDto convertCartItemToDto(CartItem cartItem) {
        Product product = cartItem.getProduct();
        Long productId = (product != null) ? product.getId() : null;
        String productName = (product != null) ? product.getName() : null;
        // Use Optional for safer handling of potentially null price
        BigDecimal unitPrice = Optional.ofNullable(product)
                                      .map(Product::getPrice)
                                      .orElse(BigDecimal.ZERO);

         return new CartItemDto(
                cartItem.getId(),
                productId,
                productName,
                cartItem.getQuantity(),
                unitPrice);
    }
}