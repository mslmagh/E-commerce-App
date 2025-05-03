package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Category; // Import Category entity
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; // Import Optional

// No @Repository needed, Spring Data JPA handles bean creation
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Finds a category by its name.
     * Since category names should be unique, this returns an Optional.
     * @param name The name of the category to find.
     * @return An Optional containing the Category if found, or empty otherwise.
     */
    Optional<Category> findByName(String name);

    // Basic CRUD methods are inherited from JpaRepository
}