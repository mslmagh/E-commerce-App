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
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByCategoryId(Long categoryId) {
        if (categoryId == null) {
            // If categoryId is null, it might be better to return all products or handle as an error based on requirements.
            // For now, returning all products if categoryId is null.
            logger.debug("categoryId is null, returning all products.");
            return getAllProducts(); 
        }
        logger.debug("Fetching products for category ID: {}", categoryId);
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return products.stream()
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
    public ProductDto createProduct(ProductRequestDto requestDto) {
        User seller = getCurrentAuthenticatedUserEntity();
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

        mapDtoToEntity(requestDto, existingProduct, existingProduct.getSeller(), category);

        Product updatedProduct = productRepository.save(existingProduct);
        logger.info("Product updated with ID: {}", updatedProduct.getId());
        return convertToDto(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id + ". Cannot delete.");
        }
        productRepository.deleteById(id);
        logger.info("Product deleted with ID: {}", id);
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
        Long categoryId = (product.getCategory() != null) ? product.getCategory().getId() : null;
        String categoryName = (product.getCategory() != null) ? product.getCategory().getName() : null;
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                categoryId,
                categoryName,
                product.getImageUrl()
        );
    }
}