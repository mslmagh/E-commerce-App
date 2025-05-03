package com.example.ecommerce.service;
import java.util.Optional;  // Import Optional for handling optional values
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.dto.ProductDto;     // Import ProductDto
import com.example.ecommerce.dto.CreateProductRequestDto; // Import CreateProductRequestDto
import com.example.ecommerce.dto.UpdateProductRequestDto;
import com.example.ecommerce.entity.Product;       // Import Product entity
import com.example.ecommerce.repository.ProductRepository; // Import ProductRepository
import org.springframework.beans.factory.annotation.Autowired; // Import Autowired
import org.springframework.stereotype.Service;           // Import Service annotation
import org.springframework.security.core.context.SecurityContextHolder; // Import SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors; // Import Collectors for stream processing

@Service // Marks this class as a Spring service component
public class ProductService {

    private final ProductRepository productRepository; // Repository dependency
    private final UserRepository userRepository;
    // Constructor injection is recommended for dependencies
    @Autowired
    public ProductService(ProductRepository productRepository, UserRepository userRepository) { // <<<--- UserRepository PARAMETRESİNİ EKLEYİN
        this.productRepository = productRepository;
        this.userRepository = userRepository; // <<<--- BU ATAMAYI EKLEYİN
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
    
    
    public ProductDto createProduct(CreateProductRequestDto requestDto) {
        // 1. Get current authenticated user's username
        String username = getCurrentAuthenticatedUsername();
        // Find the user entity corresponding to this username
        // Throw exception if user somehow not found (shouldn't happen if authenticated)
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database: " + username));

        // 2. Create a new Product entity instance
        Product newProduct = new Product();
        newProduct.setName(requestDto.getName());
        newProduct.setDescription(requestDto.getDescription());
        newProduct.setPrice(requestDto.getPrice());
        newProduct.setSeller(seller); // <<<--- SET THE SELLER

        // 3. Save the new entity
        Product savedProduct = productRepository.save(newProduct);

        // 4. Convert and return DTO
        return convertToDto(savedProduct);
    }
    public List<ProductDto> getProductsForCurrentUser() {
        String username = getCurrentAuthenticatedUsername(); // Use helper method
        List<Product> products = productRepository.findBySellerUsername(username);
        return products.stream()
                       .map(this::convertToDto)
                       .collect(Collectors.toList());
    }
    /**
     * @param id The ID of the product to update.
     * @param requestDto DTO containing the updated product details.
     * @return ProductDto representing the updated product.
     * @throws ResourceNotFoundException if no product with the given ID exists.
     */
    public ProductDto updateProduct(Long id, UpdateProductRequestDto requestDto) {
        // 1. Find the existing product by ID. Throw exception if not found.
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // 2. Update the fields of the existing entity with data from the DTO
        existingProduct.setName(requestDto.getName());
        existingProduct.setDescription(requestDto.getDescription());
        existingProduct.setPrice(requestDto.getPrice());

        // 3. Save the updated entity back to the database
        Product updatedProduct = productRepository.save(existingProduct);

        // 4. Convert the updated entity to DTO and return it
        return convertToDto(updatedProduct);
    }

    public void deleteProduct(Long id) {
        // 1. Check if the product exists before attempting deletion.
        if (!productRepository.existsById(id)) {
            // 2. If not found, throw the specific exception.
            throw new ResourceNotFoundException("Product not found with id: " + id + ". Cannot delete.");
        }
        // 3. If found, proceed with deletion.
        productRepository.deleteById(id);
        // deleteById usually returns void.
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
// Helper method to get current username
    private String getCurrentAuthenticatedUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else {
            // Handle cases where principal might be a String or anonymous
            // This part might need adjustment based on your full security config
            if (principal != null) {
                 return principal.toString();
            } else {
                // Should not happen for authenticated requests protected by security filters
                throw new IllegalStateException("Cannot get username from anonymous or unauthenticated user.");
            }
        }
    }

    // Add other service methods here later (e.g., getProductById, createProduct, etc.)
}