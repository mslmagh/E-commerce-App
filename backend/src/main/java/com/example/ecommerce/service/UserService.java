package com.example.ecommerce.service;

import com.example.ecommerce.dto.AdminUserViewDto;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    // RoleRepository ve PasswordEncoder ileride rol ve durum güncelleme için eklenecek.

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminUserViewDto> getAllUsersForAdmin() {
        return userRepository.findAll().stream()
                .map(this::convertToAdminUserViewDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserViewDto getUserByIdForAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return convertToAdminUserViewDto(user);
    }

    // Helper method to convert User entity to AdminUserViewDto
    private AdminUserViewDto convertToAdminUserViewDto(User user) {
        Set<String> roleNames = user.getRoles().stream()
                                    .map(Role::getName)
                                    .collect(Collectors.toSet());
        return new AdminUserViewDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isEnabled(),
                roleNames,
                user.getTaxId()
        );
    }
}