package com.example.ecommerce.security.jwt; // Adjust package if needed

import com.example.ecommerce.service.UserDetailsServiceImpl; // Your UserDetailsService implementation
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils; // Import StringUtils
import org.springframework.web.filter.OncePerRequestFilter; // Extend this base class

import java.io.IOException;

// No @Component needed here, we will create it as a @Bean in SecurityConfig
public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils; // Inject our JWT utility class

    @Autowired
    private UserDetailsServiceImpl userDetailsService; // Inject our UserDetailsService

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    /**
     * This method is executed for each incoming request.
     * It extracts JWT from header, validates it, and sets Authentication in SecurityContext.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // 1. Extract JWT from the Authorization header
            String jwt = parseJwt(request);

            // 2. Validate the JWT
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // 3. Extract username from the valid token
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                // 4. Load UserDetails from the database using username
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // 5. Create an Authentication object (UsernamePasswordAuthenticationToken)
                //    We use userDetails, null for credentials (already validated by JWT), and authorities from userDetails.
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // 6. Set details on the authentication object (e.g., IP address, session ID if any)
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7. Set the Authentication object in Spring Security's context
                //    This indicates the current user is authenticated.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
            // Don't throw exception here, just proceed without setting authentication
            // The security chain will handle unauthorized access later if needed.
        }

        // Continue the filter chain for the request
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        // Check if the header exists and starts with "Bearer "
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            // Extract the token part after "Bearer "
            return headerAuth.substring(7); // 7 is the length of "Bearer "
        }

        return null; // Return null if no valid Bearer token found
    }
}