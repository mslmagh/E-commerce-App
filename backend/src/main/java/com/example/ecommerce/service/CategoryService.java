package com.example.ecommerce.service;

import com.example.ecommerce.dto.CategoryDto;
import com.example.ecommerce.dto.CategoryRequestDto; // Use the new DTO name
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = findCategoryEntityById(id);
        return convertToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequestDto requestDto) { // Use Save DTO
         // Check for existing name
        categoryRepository.findByName(requestDto.getName()).ifPresent(c -> {
             throw new IllegalArgumentException("Category with name '" + requestDto.getName() + "' already exists.");
        });

        Category newCategory = new Category();
        newCategory.setName(requestDto.getName());
        Category savedCategory = categoryRepository.save(newCategory);
        return convertToDto(savedCategory);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequestDto requestDto) { // Use Save DTO
        Category existingCategory = findCategoryEntityById(id);

        // Check if new name conflicts with another existing category
        Optional<Category> conflictingCategory = categoryRepository.findByName(requestDto.getName());
        if (conflictingCategory.isPresent() && !conflictingCategory.get().getId().equals(id)) {
             throw new IllegalArgumentException("Another category with name '" + requestDto.getName() + "' already exists.");
        }

        existingCategory.setName(requestDto.getName());
        Category updatedCategory = categoryRepository.save(existingCategory);
        return convertToDto(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id) {
        // Check if category exists before deleting
        if (!categoryRepository.existsById(id)) {
             throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        // Add logic here later to handle products associated with this category if needed
        // (e.g., set product's category to null, prevent deletion if products exist, etc.)
        categoryRepository.deleteById(id);
    }


    // --- Helper Methods ---
    private Category findCategoryEntityById(Long id){
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    private CategoryDto convertToDto(Category category) {
        return new CategoryDto(category.getId(), category.getName());
    }
}