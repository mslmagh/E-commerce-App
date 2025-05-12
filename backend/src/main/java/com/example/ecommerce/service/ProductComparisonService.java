package com.example.ecommerce.service;

import com.example.ecommerce.entity.ProductComparison;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.repository.ProductComparisonRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductComparisonService {
    @Autowired
    private ProductComparisonRepository comparisonRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getComparisonListForCurrentUser() {
        User user = getCurrentUser();
        List<ProductComparison> comparisons = comparisonRepository.findByUser(user);
        return comparisons.stream()
                .map(pc -> toProductDto(pc.getProduct()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void addProductToComparison(Long productId) {
        User user = getCurrentUser();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        if (!comparisonRepository.existsByUserAndProduct(user, product)) {
            comparisonRepository.save(new ProductComparison(user, product));
        }
    }

    @Transactional
    public void removeProductFromComparison(Long productId) {
        User user = getCurrentUser();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        comparisonRepository.deleteByUserAndProduct(user, product);
    }

    @Transactional
    public void clearComparisonList() {
        User user = getCurrentUser();
        comparisonRepository.deleteByUser(user);
    }

    private ProductDto toProductDto(Product product) {
        if (product == null) return null;
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