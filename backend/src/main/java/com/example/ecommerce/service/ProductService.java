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
     * Retrieves a single product by its ID.
     * Throws ResourceNotFoundException if the product is not found.
     * @param id The ID of the product to retrieve.
     * @return The ProductDto for the found product.
     * @throws ResourceNotFoundException if no product with the given ID exists.
     */
    public ProductDto getProductById(Long id) {
        // 1. Find the Product entity by ID using the repository.
        //    findById returns an Optional<Product>.
        Optional<Product> productOptional = productRepository.findById(id);

        // 2. Check if the product was found.
        if (productOptional.isPresent()) {
            // 3. If found, get the Product entity from the Optional.
            Product product = productOptional.get();
            // 4. Convert the entity to DTO and return it.
            return convertToDto(product);
        } else {
            // 5. If not found, throw an exception.
            //    We will create a specific ResourceNotFoundException later.
            //    For now, we can throw a standard RuntimeException or create a basic one.
            //    Let's assume we have ResourceNotFoundException for now.
            throw new ResourceNotFoundException("Product not found with id: " + id);
            // Alternative (without custom exception yet):
            // throw new RuntimeException("Product not found with id: " + id);
        }
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