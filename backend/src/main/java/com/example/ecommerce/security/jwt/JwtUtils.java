package com.example.ecommerce.security.jwt; // Adjust package if needed

import io.jsonwebtoken.*; // Import main JWT classes
import io.jsonwebtoken.security.Keys; // For creating secure keys
import io.jsonwebtoken.security.SignatureException; // Import specific exceptions
import org.slf4j.Logger; // Use SLF4j for logging (better than System.out)
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // To inject values from properties
import org.springframework.security.core.Authentication; // To get user details
import org.springframework.security.core.userdetails.UserDetails; // UserDetails interface
import org.springframework.stereotype.Component; // Mark as Spring component

import javax.crypto.SecretKey; // Use SecretKey for type safety
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component // Make this class a Spring managed bean
public class JwtUtils {
    // Logger for logging errors/info
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // Inject values from application.properties
    @Value("${app.jwt.secret}") // Application specific property for the secret key
    private String jwtSecret;

    @Value("${app.jwt.expirationMs}") // Application specific property for expiration time
    private int jwtExpirationMs;

    /**
     * Generates a JWT token for the authenticated user.
     * @param authentication Spring Security Authentication object containing user details.
     * @return The generated JWT token as a String.
     */
    public String generateJwtToken(Authentication authentication) {
        // Get the username from the principal (which should be UserDetails)
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        // Build the JWT token
        return Jwts.builder()
                .setSubject(userPrincipal.getUsername()) // Set username as the subject
                .setIssuedAt(now) // Set issued date
                .setExpiration(expiryDate) // Set expiration date
                .signWith(getSigningKey(), SignatureAlgorithm.HS512) // Sign with HS512 and the secret key
                .compact(); // Build the token string
    }

    /**
     * Extracts the username from a JWT token.
     * @param token The JWT token string.
     * @return The username contained within the token.
     */
    public String getUserNameFromJwtToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // Use the same key for parsing
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject(); // Subject contains the username
    }

    /**
     * Validates a JWT token. Checks signature and expiration.
     * @param authToken The JWT token string to validate.
     * @return true if the token is valid, false otherwise.
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

    /**
     * Creates the signing key from the jwtSecret string.
     * @return A SecretKey object.
     */
    private SecretKey getSigningKey() {
        // Convert the secret string (UTF-8 bytes) into a SecretKey
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        // If your secret in properties is Base64 encoded, use this instead:
        // byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        // return Keys.hmacShaKeyFor(keyBytes);
    }
}