package com.example.ecommerce.config;

import com.example.ecommerce.entity.Role;
import com.example.ecommerce.entity.User; // Import User
import com.example.ecommerce.repository.RoleRepository;
import com.example.ecommerce.repository.UserRepository; // Import UserRepository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder; // Import PasswordEncoder
import org.springframework.stereotype.Component;
import java.util.Set; // Import Set

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository; // Inject UserRepository
    @Autowired private PasswordEncoder passwordEncoder; // Inject PasswordEncoder

    @Override
    public void run(String... args) throws Exception {
        // Add default roles if they don't exist
        Role userRole = addRoleIfNotExists("ROLE_USER");
        Role sellerRole = addRoleIfNotExists("ROLE_SELLER");
        Role adminRole = addRoleIfNotExists("ROLE_ADMIN");

        // Add test users if they don't exist
        addUserIfNotExists("user", "user@example.com", "password123", Set.of(userRole));
        addUserIfNotExists("seller", "seller@example.com", "password123", Set.of(sellerRole));
        addUserIfNotExists("admin", "admin@example.com", "password123", Set.of(adminRole));
         // Example: User with multiple roles
        addUserIfNotExists("adminseller", "adminseller@example.com", "password123", Set.of(adminRole, sellerRole));

    }

    private Role addRoleIfNotExists(String roleName) {
        // Find existing or create new one
        return roleRepository.findByName(roleName).orElseGet(() -> {
            Role newRole = new Role();
            newRole.setName(roleName);
            System.out.println(">>> Creating default role: " + roleName);
            return roleRepository.save(newRole);
        });
    }

     private void addUserIfNotExists(String username, String email, String password, Set<Role> roles) {
        // Check if user already exists by username
        if (!userRepository.findByUsername(username).isPresent()) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password)); // Encode the password
            user.setRoles(roles);
            user.setEnabled(true); // Enable the user
            System.out.println(">>> Creating test user: " + username + " with roles: " + roles.stream().map(Role::getName).toList());
            userRepository.save(user);
        }
    }
}