package com.example.ecommerce.service; // Or your security service package

import com.example.ecommerce.entity.User; // Import your User entity
import com.example.ecommerce.repository.UserRepository; // Import your UserRepository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Optional but good practice

@Service // Mark this as a Spring service bean
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired // Inject the UserRepository
    private UserRepository userRepository;

    @Override
    @Transactional(readOnly = true) // Use read-only transaction for loading user data
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Find the user by username using the repository
        User user = userRepository.findByUsername(username)
                // 2. If user is not found, throw the exception expected by Spring Security
                .orElseThrow(() ->
                        new UsernameNotFoundException("User Not Found with username: " + username));

        // 3. If user is found, return the User object directly.
        //    Since your User entity implements UserDetails, Spring Security can use it directly.
        //    The getAuthorities() method you implemented in User entity will provide the roles.
        return user;
    }
}