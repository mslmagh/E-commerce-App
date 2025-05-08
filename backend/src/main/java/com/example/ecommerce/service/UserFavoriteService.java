package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductDto;
import com.example.ecommerce.dto.UserFavoriteDto; // DTO adı güncellendi
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.entity.UserFavorite; // Entity adı güncellendi
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.UserFavoriteRepository; // Repository adı güncellendi
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserFavoriteService { // Sınıf adı güncellendi

    private static final Logger logger = LoggerFactory.getLogger(UserFavoriteService.class);

    private final UserFavoriteRepository userFavoriteRepository; // Tip güncellendi
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    // ProductService enjeksiyonuna burada gerek kalmadı, ProductDto dönüşümünü kendimiz yapacağız.

    @Autowired
    public UserFavoriteService(UserFavoriteRepository userFavoriteRepository, // Tip güncellendi
                               UserRepository userRepository,
                               ProductRepository productRepository) {
        this.userFavoriteRepository = userFavoriteRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public UserFavoriteDto getFavoritesForCurrentUser(String username) { // Metot adı güncellendi
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        UserFavorite userFavorite = userFavoriteRepository.findByUserUsername(user.getUsername())
                .orElseGet(() -> createNewUserFavorite(user)); // Metot adı güncellendi
        return convertToDto(userFavorite);
    }

    @Transactional
    public UserFavoriteDto addProductToFavorites(Long productId, String username) { // Metot adı güncellendi
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        UserFavorite userFavorite = userFavoriteRepository.findByUserUsername(user.getUsername())
                .orElseGet(() -> createNewUserFavorite(user)); // Metot adı güncellendi

        if (userFavorite.getProducts().stream().anyMatch(p -> p.getId().equals(productId))) {
            logger.info("Product ID {} already in favorites for user {}", productId, username);
            return convertToDto(userFavorite);
        }

        userFavorite.addProduct(product);
        UserFavorite updatedUserFavorite = userFavoriteRepository.save(userFavorite); // Tip güncellendi
        logger.info("Product ID {} added to favorites for user {}", productId, username);
        return convertToDto(updatedUserFavorite);
    }

    @Transactional
    public UserFavoriteDto removeProductFromFavorites(Long productId, String username) { // Metot adı güncellendi
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        UserFavorite userFavorite = userFavoriteRepository.findByUserUsername(user.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Favorites list not found for user: " + username + ". Cannot remove product."));

        boolean removed = userFavorite.getProducts().removeIf(p -> p.getId().equals(productId));

        if (!removed) {
            logger.info("Product ID {} not found in favorites for user {}. No action taken.", productId, username);
            return convertToDto(userFavorite);
        }

        UserFavorite updatedUserFavorite = userFavoriteRepository.save(userFavorite); // Tip güncellendi
        logger.info("Product ID {} removed from favorites for user {}", productId, username);
        return convertToDto(updatedUserFavorite);
    }

    @Transactional
    public void clearFavorites(String username) { // Metot adı güncellendi
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        UserFavorite userFavorite = userFavoriteRepository.findByUserUsername(user.getUsername()).orElse(null);

        if (userFavorite != null && !userFavorite.getProducts().isEmpty()) {
            userFavorite.getProducts().clear();
            userFavoriteRepository.save(userFavorite);
            logger.info("Favorites list cleared for user {}", username);
        } else {
            logger.info("Favorites list for user {} was already empty or not found.", username);
        }
    }

    private UserFavorite createNewUserFavorite(User user) { // Metot ve dönüş tipi güncellendi
        UserFavorite newUserFavorite = new UserFavorite(user); // Tip güncellendi
        logger.info("Creating new favorites list for user {}", user.getUsername());
        return userFavoriteRepository.save(newUserFavorite);
    }

    private ProductDto convertProductToDto(Product product) {
        if (product == null) return null;
        Long categoryId = (product.getCategory() != null) ? product.getCategory().getId() : null;
        String categoryName = (product.getCategory() != null) ? product.getCategory().getName() : null;
        // ProductDto constructor'ınızın parametrelerini kontrol edin.
        // Seller bilgisi varsa ve ProductDto'da bekleniyorsa ekleyin.
        return new ProductDto(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getPrice(),
            product.getStockQuantity(),
            categoryId,
            categoryName,
            product.getImageUrl()
            // Örneğin, product.getSeller() != null ? product.getSeller().getUsername() : null gibi
        );
    }

    private UserFavoriteDto convertToDto(UserFavorite userFavorite) { // Parametre ve dönüş tipi güncellendi
        List<ProductDto> productDtos = userFavorite.getProducts().stream()
                .map(this::convertProductToDto)
                .collect(Collectors.toList());

        return new UserFavoriteDto( // DTO adı güncellendi
                userFavorite.getId(),
                userFavorite.getUser().getId(),
                productDtos,
                userFavorite.getCreatedDate(),
                userFavorite.getLastModifiedDate()
        );
    }
}