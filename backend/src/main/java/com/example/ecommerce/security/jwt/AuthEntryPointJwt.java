package com.example.ecommerce.security.jwt;

import com.fasterxml.jackson.databind.ObjectMapper; // Import ObjectMapper
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType; // Import MediaType
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component; // Import Component

import java.io.IOException;
import java.util.HashMap; // Import HashMap
import java.util.Map; // Import Map

@Component // Mark this as a Spring component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    // This method is called whenever an unauthenticated user tries to access a secured resource
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {

        logger.error("Unauthorized error: {}", authException.getMessage());

        // Set response type to application/json
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        // Set response status to 401 Unauthorized
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Create a response body map
        final Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", authException.getMessage()); // Include exception message
        body.put("path", request.getServletPath());

        // Use Jackson ObjectMapper to write the map as JSON to the response stream
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}