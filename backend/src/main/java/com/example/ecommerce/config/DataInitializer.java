package com.example.ecommerce.config; // Adjust package if needed

import com.example.ecommerce.entity.Role;
import com.example.ecommerce.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component // Make it a Spring bean
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Add default roles if they don't exist
        addRoleIfNotExists("ROLE_USER");
        addRoleIfNotExists("ROLE_SELLER");
        addRoleIfNotExists("ROLE_ADMIN");
    }

    private void addRoleIfNotExists(String roleName) {
        // Check if the role already exists
        if (!roleRepository.findByName(roleName).isPresent()) {
            // If not, create and save the new role
            Role newRole = new Role();
            newRole.setName(roleName);
            roleRepository.save(newRole);
            System.out.println(">>> Created default role: " + roleName);
        }
    }
}