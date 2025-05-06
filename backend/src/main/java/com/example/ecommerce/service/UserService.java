package com.example.ecommerce.service;

import com.example.ecommerce.dto.AdminUserViewDto;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.RoleRepository; // Eklendi
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger; // Eklendi
import org.slf4j.LoggerFactory; // Eklendi
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.crypto.password.PasswordEncoder; // İleride şifre reset için
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils; // Eklendi

import java.util.HashSet; // Eklendi
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class); // Eklendi

    private final UserRepository userRepository;
    private final RoleRepository roleRepository; // Eklendi
    // private final PasswordEncoder passwordEncoder; // İleride şifre reset için

    @Autowired
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository
                       /*, PasswordEncoder passwordEncoder*/) { // Eklendi
        this.userRepository = userRepository;
        this.roleRepository = roleRepository; // Eklendi
        // this.passwordEncoder = passwordEncoder; // İleride şifre reset için
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

    @Transactional
    public AdminUserViewDto updateUserRoles(Long userId, Set<String> newRoleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Set<Role> newRoles = new HashSet<>();
        for (String roleName : newRoleNames) {
            String correctedRoleName = roleName.toUpperCase();
            if (!correctedRoleName.startsWith("ROLE_")) {
                correctedRoleName = "ROLE_" + correctedRoleName;
            }
            Role role = roleRepository.findByName(correctedRoleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
            newRoles.add(role);
        }

        user.setRoles(newRoles);
        User updatedUser = userRepository.save(user);
        logger.info("Updated roles for user ID {}: {}", userId, newRoleNames);
        return convertToAdminUserViewDto(updatedUser);
    }

    @Transactional
    public AdminUserViewDto updateUserEnabledStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setEnabled(enabled);
        User updatedUser = userRepository.save(user);
        logger.info("Updated enabled status for user ID {} to: {}", userId, enabled);
        return convertToAdminUserViewDto(updatedUser);
    }

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