package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.dto.ProductRequestDto; // Correct DTO name
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class); // Logger instance

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Autowired
    public ProductService(ProductRepository productRepository, UserRepository userRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductRequestDto requestDto) { // Use ProductRequestDto
        User seller = getCurrentAuthenticatedUserEntity();
        Category category = findCategoryById(requestDto.getCategoryId());

        Product newProduct = new Product();
        mapDtoToEntity(requestDto, newProduct, seller, category); // Use helper method

        Product savedProduct = productRepository.save(newProduct);
        logger.info("Product created with ID: {} by seller: {}", savedProduct.getId(), seller.getUsername());
        return convertToDto(savedProduct);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequestDto requestDto) { // Use ProductRequestDto
        // Ownership check is handled by @PreAuthorize in controller
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        Category category = findCategoryById(requestDto.getCategoryId());

        mapDtoToEntity(requestDto, existingProduct, existingProduct.getSeller(), category); // Use helper method

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product updated with ID: {}", updatedProduct.getId());
        return convertToDto(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        // Ownership check handled by @PreAuthorize
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id + ". Cannot delete.");
        }
        productRepository.deleteById(id);
        logger.info("Product deleted with ID: {}", id);
    }

    // ===> NEW STOCK METHODS <===
    @Transactional // Default propagation should be fine here usually
    public void decreaseStock(Long productId, int quantity) {
         if (quantity <= 0) {
             logger.warn("Attempted to decrease stock for product ID {} with non-positive quantity {}", productId, quantity);
             throw new IllegalArgumentException("Quantity to decrease must be positive.");
         }

         // Find product - use pessimistic lock if high concurrency is expected
         Product product = productRepository.findById(productId)
                // .withLock(LockModeType.PESSIMISTIC_WRITE) // Consider locking for concurrency
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + " while trying to decrease stock."));

         int currentStock = product.getStockQuantity();
         logger.debug("Decreasing stock for product ID {}. Current: {}, Requested: {}", productId, currentStock, quantity);
         if (currentStock < quantity) {
             throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                                                ". Requested: " + quantity + ", Available: " + currentStock);
         }

         product.setStockQuantity(currentStock - quantity);
         productRepository.save(product);
         logger.info("Stock decreased for product ID {}. New stock: {}", productId, product.getStockQuantity());
    }

    @Transactional
     public void increaseStock(Long productId, int quantity) {
         if (quantity <= 0) {
             logger.warn("Attempted to increase stock for product ID {} with non-positive quantity {}", productId, quantity);
             throw new IllegalArgumentException("Quantity to increase must be positive.");
         }
         Product product = productRepository.findById(productId)
                 .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + " while trying to increase stock."));

         int currentStock = product.getStockQuantity();
         logger.debug("Increasing stock for product ID {}. Current: {}, Amount: {}", productId, currentStock, quantity);
         product.setStockQuantity(currentStock + quantity);
         productRepository.save(product);
         logger.info("Stock increased for product ID {}. New stock: {}", productId, product.getStockQuantity());
     }
    // ===> END NEW STOCK METHODS <===

    // --- Helper Methods ---

    private User getCurrentAuthenticatedUserEntity() {
         Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
         String username;
         if (principal instanceof UserDetails) {
             username = ((UserDetails) principal).getUsername();
         } else if (principal != null) { // Handle cases where principal might just be the username string
             username = principal.toString();
         }
          else {
             // Should not happen for authenticated requests protected by security filters
             throw new IllegalStateException("Cannot get username from anonymous or unauthenticated user.");
         }
         return userRepository.findByUsername(username)
                 .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
     }

    private Category findCategoryById(Long categoryId) {
         return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
    }

    // Helper to map request DTO to entity for create/update
    private void mapDtoToEntity(ProductRequestDto dto, Product product, User seller, Category category) { // Use ProductRequestDto
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setCategory(category);
        if (product.getId() == null) { // Only set seller on creation
            product.setSeller(seller);
        }
    }

    // Helper to convert Entity to Response DTO
    private ProductDto convertToDto(Product product) {
        Long categoryId = (product.getCategory() != null) ? product.getCategory().getId() : null;
        String categoryName = (product.getCategory() != null) ? product.getCategory().getName() : null;
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(), // Include stock
                categoryId,
                categoryName
        );
    }
}