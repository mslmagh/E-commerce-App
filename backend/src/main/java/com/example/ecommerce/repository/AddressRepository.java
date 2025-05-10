package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {
    // Find all addresses belonging to a specific user ID
    List<Address> findByUserId(Long userId);
    
    // Find only active addresses belonging to a specific user ID
    List<Address> findByUserIdAndActiveTrue(Long userId);
    
    // Find an active address by ID
    Optional<Address> findByIdAndActiveTrue(Long id);
}