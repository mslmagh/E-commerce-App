package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {
    // Find addresses belonging to a specific user ID
    List<Address> findByUserId(Long userId);
}