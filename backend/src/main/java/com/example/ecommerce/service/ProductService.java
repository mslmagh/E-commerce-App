package com.example.ecommerce.service;

import com.example.ecommerce.dto.CreateProductRequestDto;
import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.dto.UpdateProductRequestDto;
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional

import java.math.BigDecimal; // Import BigDecimal
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Autowired
    public ProductService(ProductRepository productRepository,
                          UserRepository userRepository,
                          CategoryRepository categoryRepository
                         ) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    // GET All Products (No change needed here unless filtering by stock later)
    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // GET Product by ID (No change needed here)
    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDto(product);
    }

    // CREATE Product (Updated to set stock)
    @Transactional
    public ProductDto createProduct(CreateProductRequestDto requestDto) {
        String username = getCurrentAuthenticatedUsername();
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));

        Category category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + requestDto.getCategoryId()));

        Product newProduct = new Product();
        newProduct.setName(requestDto.getName());
        newProduct.setDescription(requestDto.getDescription());
        newProduct.setPrice(requestDto.getPrice()); // Set BigDecimal price
        newProduct.setStockQuantity(requestDto.getStockQuantity()); // <<<--- SET STOCK QUANTITY
        newProduct.setSeller(seller);
        newProduct.setCategory(category);

        Product savedProduct = productRepository.save(newProduct);
        return convertToDto(savedProduct);
    }

    // UPDATE Product (Updated to set stock)
    @Transactional
    public ProductDto updateProduct(Long id, UpdateProductRequestDto requestDto) {
        // Ownership check is handled by @PreAuthorize in controller
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        Category category = categoryRepository.findById(requestDto.getCategoryId())
                 .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + requestDto.getCategoryId()));

        // Update fields including stock
        existingProduct.setName(requestDto.getName());
        existingProduct.setDescription(requestDto.getDescription());
        existingProduct.setPrice(requestDto.getPrice()); // Set BigDecimal price
        existingProduct.setStockQuantity(requestDto.getStockQuantity()); // <<<--- UPDATE STOCK QUANTITY
        existingProduct.setCategory(category);

        Product updatedProduct = productRepository.save(existingProduct);
        return convertToDto(updatedProduct);
    }

    // DELETE Product (No change needed here)
    @Transactional
    public void deleteProduct(Long id) {
        // Ownership check handled by @PreAuthorize
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id + ". Cannot delete.");
        }
        productRepository.deleteById(id);
    }

    // Helper method to get current username
    private String getCurrentAuthenticatedUsername() {
         Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
         String username;
         if (principal instanceof UserDetails) {
             username = ((UserDetails) principal).getUsername();
         } else {
             username = principal.toString();
         }
         // Ensure user exists - needed for seller assignment
         userRepository.findByUsername(username)
                 .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
         return username;
     }


    // Helper method to convert Entity to DTO (Updated for stock and BigDecimal price)
    private ProductDto convertToDto(Product product) {
        Long categoryId = null;
        String categoryName = null;
        if (product.getCategory() != null) {
            categoryId = product.getCategory().getId();
            categoryName = product.getCategory().getName();
        }
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(), // Pass BigDecimal price
                product.getStockQuantity(), // <<<--- PASS STOCK QUANTITY
                categoryId,
                categoryName
        );
    }
}