package com.example.ecommerce.service;

import com.example.ecommerce.dto.AdminUserViewDto;
import com.example.ecommerce.dto.UserProfileDto;
import com.example.ecommerce.dto.UpdateUserProfileRequestDto;
import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.RoleRepository;
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.crypto.password.PasswordEncoder; // İleride şifre reset için
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Collections;
import java.util.Objects;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    // private final PasswordEncoder passwordEncoder; // İleride şifre reset için

    @Autowired
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository
                       /*, PasswordEncoder passwordEncoder*/) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        // this.passwordEncoder = passwordEncoder; // İleride şifre reset için
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return convertToUserProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateCurrentUserProfile(UpdateUserProfileRequestDto requestDto) {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

        user.setFirstName(requestDto.getFirstName());
        user.setLastName(requestDto.getLastName());
        user.setPhoneNumber(requestDto.getPhoneNumber());

        // Update taxId only if the user is a seller and the taxId is provided in the request
        // The DTO allows taxId to be null, so we check for that too.
        boolean isSeller = user.getRoles().stream().anyMatch(role -> "ROLE_SELLER".equals(role.getName()));
        if (isSeller) {
            // If taxId is explicitly provided in the DTO (even if it's an empty string to clear it),
            // update it. If it's null in the DTO, it means no change was intended by the client for this field.
            if (requestDto.getTaxId() != null) { 
                user.setTaxId(StringUtils.hasText(requestDto.getTaxId()) ? requestDto.getTaxId() : null);
            }
        } else {
            // If user is not a seller, ensure taxId is null to prevent non-sellers from having one.
            user.setTaxId(null);
        }

        User updatedUser = userRepository.save(user);
        logger.info("User profile updated for user: {}", username);
        return convertToUserProfileDto(updatedUser);
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
        logger.info("[Service] Attempting to update enabled status for user ID {} to: {}", userId, enabled);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("[Service] User not found with id: {} during status update.", userId);
                    return new ResourceNotFoundException("User not found with id: " + userId);
                });

        logger.info("[Service] User {} found. Current enabled status: {}. Setting to: {}", user.getUsername(), user.isEnabled(), enabled);
        user.setEnabled(enabled);
        User updatedUser = userRepository.save(user);
        
        logger.info("[Service] User {} status saved. New enabled status in updatedUser entity: {}. Is entity managed: {}", 
            updatedUser.getUsername(), 
            updatedUser.isEnabled(),
            entityManager.contains(updatedUser) 
        ); 
        
        // Optional: Re-fetch from DB to confirm
        User persistedUser = userRepository.findById(userId).orElse(null);
        if (persistedUser != null) {
            logger.info("[Service] User {} status re-fetched from DB. DB enabled status: {}", persistedUser.getUsername(), persistedUser.isEnabled());
            if (persistedUser.isEnabled() != enabled) {
                logger.error("[Service] CRITICAL: DB status for user {} ({}) does not match intended status ({}) after save!", 
                            persistedUser.getUsername(), persistedUser.isEnabled(), enabled);
            }
        } else {
            logger.error("[Service] CRITICAL: User {} not found in DB after attempting save!", userId);
        }

        logger.info("[Service] Returning DTO for user ID {} with enabled status: {}", userId, updatedUser.isEnabled());
        return convertToAdminUserViewDto(updatedUser);
    }

    private AdminUserViewDto convertToAdminUserViewDto(User user) {
        Set<String> roleNames = Collections.emptySet();
        if (user.getRoles() != null) {
            roleNames = user.getRoles().stream()
                            .filter(Objects::nonNull)
                            .map(Role::getName)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());
        } else {
            logger.warn("User with ID {} has a null set of roles during DTO conversion.", user.getId());
        }
        
        return new AdminUserViewDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.isEnabled(),
                roleNames,
                user.getTaxId()
        );
    }

    private UserProfileDto convertToUserProfileDto(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        return new UserProfileDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getTaxId(),
                roleNames
        );
    }
}