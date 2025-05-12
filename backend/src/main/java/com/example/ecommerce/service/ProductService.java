package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.dto.ProductRequestDto;
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

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
        return productRepository.findAllByIsActiveTrue().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProductsForAdmin() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            logger.info("ProductService: getProductsByIds called with empty or null ID list.");
            return Collections.emptyList();
        }
        logger.info("ProductService: Fetching products for IDs: {}", ids);
        List<Product> products = productRepository.findAllById(ids);
        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategoryId(Long categoryId) {
        if (categoryId == null) {
            logger.debug("categoryId is null, returning all active products.");
            return getAllProducts(); 
        }
        logger.debug("Fetching active products for category ID: {}", categoryId);
        List<Product> products = productRepository.findByCategoryIdAndIsActiveTrue(categoryId);
        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product (any status) not found with id: " + id));

        if (!product.isActive()) {
            // Ürün pasif ise sadece admin veya ürünün satıcısı görebilir.
            // Bu kontrol normalde controller veya daha üst bir katmanda yapılmalı,
            // ancak şimdilik burada temel bir kontrol ekleyebiliriz veya her zaman tüm bilgiyi dönüp controller'da filtreleyebiliriz.
            // Güvenlik açısından, bu tür yetkilendirme @PostAuthorize ile veya controller'da yapılmalı.
            // Şimdilik, her zaman ürünü döndüreceğiz ve DTO isActive bilgisini taşıyacak.
            // Frontend, kullanıcının rolüne göre pasif ürünü gösterip göstermeyeceğine karar verebilir.
            // Veya Controller seviyesinde yetkiye göre farklı servis metotları çağrılabilir.
            // Örnek: AdminController -> productService.getProductDetailsForAdmin(id)
            //        PublicController -> productService.getPublicProductDetails(id)
            logger.warn("Product with ID: {} is inactive. Accessing details.", id);
        }
        return convertToDto(product); // Her zaman tüm detayları dön, isActive bilgisi DTO'da var.
    }

    @Transactional
    public ProductDto createProduct(ProductRequestDto requestDto) {
        User seller;
        if (requestDto.getSellerId() != null) {
            seller = userRepository.findById(requestDto.getSellerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + requestDto.getSellerId()));
        } else {
            User currentUser = getCurrentAuthenticatedUserEntity();
            if (currentUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_SELLER"))) {
                seller = currentUser;
            } else if (currentUser.getRoles().stream().anyMatch(role -> role.getName().equals("ROLE_ADMIN"))){
                 throw new IllegalArgumentException("Admin must specify a sellerId to create a product.");
            } else {
                throw new ResourceNotFoundException("Seller ID is required or current user is not a seller.");
            }
        }

        Category category = findCategoryById(requestDto.getCategoryId());

        Product newProduct = new Product();
        mapDtoToEntity(requestDto, newProduct, seller, category);

        Product savedProduct = productRepository.save(newProduct);
        logger.info("Product created with ID: {} by seller: {}", savedProduct.getId(), seller.getUsername());
        return convertToDto(savedProduct);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequestDto requestDto) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        Category category = findCategoryById(requestDto.getCategoryId());

        User sellerToUpdate = existingProduct.getSeller();
        if (requestDto.getSellerId() != null) {
            User currentUser = getCurrentAuthenticatedUserEntity();
            boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
            if (isAdmin) {
                 sellerToUpdate = userRepository.findById(requestDto.getSellerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + requestDto.getSellerId()));
            } else if (!existingProduct.getSeller().getId().equals(requestDto.getSellerId())){
                logger.warn("Non-admin user {} attempted to change sellerId for product {}. Denied.", currentUser.getUsername(), id);
            }
        }

        mapDtoToEntity(requestDto, existingProduct, sellerToUpdate, category);

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product updated with ID: {}", updatedProduct.getId());
        return convertToDto(updatedProduct);
    }

    @Transactional
    public ProductDto deactivateProduct(Long id, String reason) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id + ". Cannot deactivate."));

        if (!product.isActive()) {
            // İsteğe bağlı: Zaten pasif olan bir ürün tekrar pasife alınmaya çalışılırsa ne yapılmalı?
            // Hata fırlatılabilir veya mevcut durum korunabilir.
            // Şimdilik loglayıp ürünü olduğu gibi dönelim.
            logger.warn("Product with ID: {} is already inactive. Deactivation attempt by admin with reason: {}.", id, reason);
            return convertToDto(product); // Veya bir exception fırlat: throw new IllegalStateException("Product is already inactive.");
        }

        product.setActive(false);
        product.setDeactivationReason(reason);
        product.setDeactivatedAt(java.time.LocalDateTime.now()); // LocalDateTime importu zaten olmalı
        
        Product deactivatedProduct = productRepository.save(product);
        logger.info("Product with ID: {} deactivated. Reason: {}", id, reason);
        return convertToDto(deactivatedProduct);
    }

    @Transactional
    public ProductDto reactivateProduct(Long productId) {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + ". Cannot reactivate."));

        // Check if the current user is an Admin
        boolean isAdmin = currentUser.getRoles().stream()
                                     .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));

        // Allow if admin OR current user is the seller of the product
        if (!isAdmin && !product.getSeller().getId().equals(currentUser.getId())) {
            logger.warn("User {} (not admin or owner) attempted to reactivate product ID: {} owned by another seller ({}).",
                    currentUser.getUsername(), productId, product.getSeller().getUsername());
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to reactivate this product.");
        }

        if (product.isActive()) {
            logger.warn("Product with ID: {} is already active. Reactivation attempt by seller: {}.", productId, currentUser.getUsername());
            return convertToDto(product); // Already active, no change needed
        }

        product.setActive(true);
        product.setDeactivationReason(null); // Clear deactivation reason
        product.setDeactivatedAt(null);      // Clear deactivation timestamp

        Product reactivatedProduct = productRepository.save(product);
        logger.info("Product with ID: {} reactivated by seller: {}", productId, currentUser.getUsername());
        return convertToDto(reactivatedProduct);
    }

    @Transactional(readOnly = true)
    public void checkStockAvailability(Long productId, int quantityNeeded) {
        logger.debug("Checking stock for Product ID: {}, Quantity Needed: {}", productId, quantityNeeded);
        Product product = productRepository.findById(productId)
             .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + " during stock check."));

        if (product.getStockQuantity() < quantityNeeded) {
            logger.warn("Insufficient stock for Product ID: {}. Requested: {}, Available: {}", productId, quantityNeeded, product.getStockQuantity());
            throw new IllegalArgumentException("Insufficient stock for product: " + product.getName() +
                                               ". Requested: " + quantityNeeded +
                                               ", Available: " + product.getStockQuantity());
        }
         logger.debug("Stock check passed for Product ID: {}", productId);
    }

    public void decreaseStock(Long productId, int quantityToDecrease) {
        if (quantityToDecrease <= 0) {
            return;
        }
        logger.info("Decreasing stock for Product ID: {} by Quantity: {}", productId, quantityToDecrease);
        Product product = productRepository.findById(productId)
             .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + " while decreasing stock."));

        int newStock = product.getStockQuantity() - quantityToDecrease;
        if (newStock < 0) {
             logger.error("Attempted to decrease stock below zero for Product ID: {}. Current: {}, Decrease: {}",
                     productId, product.getStockQuantity(), quantityToDecrease);
            throw new IllegalArgumentException("Stock cannot go below zero for product: " + product.getName());
        }
        product.setStockQuantity(newStock);
        productRepository.save(product);
         logger.info("Stock updated for Product ID: {}. New Stock: {}", productId, newStock);
    }

    @Transactional
    public void increaseStock(Long productId, int quantityToIncrease) {
        if (quantityToIncrease <= 0) {
            return;
        }
        logger.info("Increasing stock for Product ID: {} by Quantity: {}", productId, quantityToIncrease);
        Product product = productRepository.findById(productId)
             .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId + " while increasing stock."));

        int newStock = product.getStockQuantity() + quantityToIncrease;
        product.setStockQuantity(newStock);
        productRepository.save(product);
         logger.info("Stock updated for Product ID: {}. New Stock: {}", productId, newStock);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsForCurrentSeller() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        logger.debug("Fetching products for current seller: {}", currentUser.getUsername());
        List<Product> products = productRepository.findBySellerUsername(currentUser.getUsername());
        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsBySellerUsername(String username) {
        logger.debug("Fetching active products for seller username: {}", username);
        List<Product> products = productRepository.findBySellerUsernameAndIsActiveTrue(username);
        if (products.isEmpty()) {
            // Optional: Check if seller exists to differentiate no products vs. no seller
            userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with username: " + username));
        }
        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

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

    private Category findCategoryById(Long categoryId) {
         return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));
    }

    private void mapDtoToEntity(ProductRequestDto dto, Product product, User seller, Category category) {
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setCategory(category);
        product.setImageUrl(dto.getImageUrl());
        if (product.getId() == null) {
            product.setSeller(seller);
        }
    }

    private ProductDto convertToDto(Product product) {
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getImageUrl(),
                product.getAverageRating(),
                product.getReviewCount(),
                product.isActive(),
                product.getDeactivationReason(),
                product.getDeactivatedAt(),
                product.getSeller() != null ? product.getSeller().getId() : null,
                product.getSeller() != null ? product.getSeller().getUsername() : null
        );
    }
}