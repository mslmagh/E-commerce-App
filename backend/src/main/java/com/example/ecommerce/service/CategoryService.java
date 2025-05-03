package com.example.ecommerce.service;

import com.example.ecommerce.dto.CategoryDto;
import com.example.ecommerce.dto.CreateCategoryRequestDto;
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // Get all categories
    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Get category by ID
    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return convertToDto(category);
    }

    // Create a new category
    @Transactional // Not read-only
    public CategoryDto createCategory(CreateCategoryRequestDto requestDto) {
        // Check if category with the same name already exists (optional but good practice)
         if (categoryRepository.findByName(requestDto.getName()).isPresent()) {
             throw new IllegalArgumentException("Category with name '" + requestDto.getName() + "' already exists.");
         }

        Category newCategory = new Category();
        newCategory.setName(requestDto.getName());
        Category savedCategory = categoryRepository.save(newCategory);
        return convertToDto(savedCategory);
    }

    // Helper method to convert Entity to DTO
    private CategoryDto convertToDto(Category category) {
        return new CategoryDto(category.getId(), category.getName());
    }

    // Add updateCategory and deleteCategory methods later if needed
}