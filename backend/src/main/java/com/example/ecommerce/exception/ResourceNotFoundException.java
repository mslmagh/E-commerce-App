package com.example.ecommerce.exception;

import org.springframework.http.HttpStatus; // Import HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus; // Import ResponseStatus

// This annotation marks the exception to return a specific HTTP status code
// Although we handle it globally, this can be a fallback or informational.
@ResponseStatus(value = HttpStatus.NOT_FOUND) // 404 Not Found
public class ResourceNotFoundException extends RuntimeException {

    // Standard constructor accepting a message
    public ResourceNotFoundException(String message) {
        super(message); // Pass message to the parent RuntimeException
    }

    // Optional: Constructor with message and cause
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}