package com.example.ecommerce.service;
import java.util.Optional;  // Import Optional for handling optional values
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.dto.ProductDto;     // Import ProductDto
import com.example.ecommerce.dto.CreateProductRequestDto; // Import CreateProductRequestDto
import com.example.ecommerce.dto.UpdateProductRequestDto;
import com.example.ecommerce.entity.Product;       // Import Product entity
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository; // Import ProductRepository
import org.springframework.beans.factory.annotation.Autowired; // Import Autowired
import org.springframework.stereotype.Service;           // Import Service annotation
import org.springframework.security.core.context.SecurityContextHolder; // Import SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.entity.Category; // Import Category entity
import java.util.List;
import java.util.stream.Collectors; // Import Collectors for stream processing

@Service // Marks this class as a Spring service component
public class ProductService {

    private final CategoryRepository categoryRepository; 
    private final ProductRepository productRepository; // Repository dependency
    private final UserRepository userRepository;
    // Constructor injection is recommended for dependencies
    @Autowired
    public ProductService(ProductRepository productRepository,
                          UserRepository userRepository,
                          CategoryRepository categoryRepository // <<<--- Constructor'a EKLE
                         ) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository; // <<<--- Atamayı EKLE
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
        String username = getCurrentAuthenticatedUsername();
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));

        // Find the category by ID provided in DTO
        Category category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + requestDto.getCategoryId()));

        Product newProduct = new Product();
        newProduct.setName(requestDto.getName());
        newProduct.setDescription(requestDto.getDescription());
        newProduct.setPrice(requestDto.getPrice());
        newProduct.setSeller(seller);
        newProduct.setCategory(category); // <<<--- Kategoriyi set et

        Product savedProduct = productRepository.save(newProduct);
        return convertToDto(savedProduct);
    }
    public List<ProductDto> getProductsForCurrentUser() {
        String username = getCurrentAuthenticatedUsername(); // Use helper method
        List<Product> products = productRepository.findBySellerUsername(username);
        return products.stream()
                       .map(this::convertToDto)
                       .collect(Collectors.toList());
    }
  
    public ProductDto updateProduct(Long id, UpdateProductRequestDto requestDto) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Find the new category
        Category category = categoryRepository.findById(requestDto.getCategoryId())
                 .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + requestDto.getCategoryId()));

        // Update fields
        existingProduct.setName(requestDto.getName());
        existingProduct.setDescription(requestDto.getDescription());
        existingProduct.setPrice(requestDto.getPrice());
        existingProduct.setCategory(category); // <<<--- Kategoriyi güncelle

        Product updatedProduct = productRepository.save(existingProduct);
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


  
    private ProductDto convertToDto(Product product) {
        Long categoryId = null;
        String categoryName = null;
        if (product.getCategory() != null) { // Check if category exists
            categoryId = product.getCategory().getId();
            categoryName = product.getCategory().getName();
        }
        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                categoryId,     // <<<--- Category ID ekle
                categoryName    // <<<--- Category Name ekle
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