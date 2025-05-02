package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductDto;     // Import ProductDto
import com.example.ecommerce.entity.Product;       // Import Product entity
import com.example.ecommerce.repository.ProductRepository; // Import ProductRepository
import org.springframework.beans.factory.annotation.Autowired; // Import Autowired
import org.springframework.stereotype.Service;           // Import Service annotation

import java.util.List;
import java.util.stream.Collectors; // Import Collectors for stream processing

@Service // Marks this class as a Spring service component
public class ProductService {

    private final ProductRepository productRepository; // Repository dependency

    // Constructor injection is recommended for dependencies
    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Retrieves all products from the database and maps them to ProductDto objects.
     * @return A list of ProductDto objects.
     */
    public List<ProductDto> getAllProducts() {
        // 1. Fetch all Product entities from the repository
        List<Product> products = productRepository.findAll();

        // 2. Map the list of Product entities to a list of ProductDto objects
        // We use Java Streams API here for concise mapping
        List<ProductDto> productDtos = products.stream()
                .map(this::convertToDto) // Call mapping method for each product
                .collect(Collectors.toList()); // Collect results into a List

        // 3. Return the list of DTOs
        return productDtos;
    }

    /**
     * Helper method to convert a Product entity to a ProductDto.
     * @param product The Product entity to convert.
     * @return The corresponding ProductDto.
     */
    private ProductDto convertToDto(Product product) {
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice()
        );
    }

    // Add other service methods here later (e.g., getProductById, createProduct, etc.)
}