package com.example.ecommerce.service; // Adjust package if needed

import com.example.ecommerce.entity.Product;
import com.example.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("productSecurityService") // Give it a specific bean name for use in SpEL
public class ProductSecurityService {

    @Autowired
    private ProductRepository productRepository;

    /**
     * Checks if the currently authenticated user (principal) is the owner of the product.
     * @param principal The authenticated user details.
     * @param productId The ID of the product to check.
     * @return true if the user is the owner, false otherwise.
     */
    public boolean isOwner(UserDetails principal, Long productId) {
        if (principal == null || productId == null) {
            return false;
        }
        // Find the product
        Optional<Product> productOptional = productRepository.findById(productId);
        if (!productOptional.isPresent()) {
            // Product doesn't exist, so no one owns it in this context
            return false;
        }
        Product product = productOptional.get();
        // Check if the product's seller username matches the principal's username
        return product.getSeller() != null && product.getSeller().getUsername().equals(principal.getUsername());
    }
}