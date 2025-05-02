package com.example.ecommerce.exception;

import org.springframework.http.HttpStatus; // Import HttpStatus
import org.springframework.http.ResponseEntity; // Import ResponseEntity
import org.springframework.web.bind.annotation.ControllerAdvice; // Import ControllerAdvice (or RestControllerAdvice)
import org.springframework.web.bind.annotation.ExceptionHandler; // Import ExceptionHandler
import org.springframework.web.context.request.WebRequest; // Import WebRequest

import java.util.Date; // For timestamp, optional

// Use @RestControllerAdvice for REST APIs as it combines @ControllerAdvice and @ResponseBody
@ControllerAdvice // Or @RestControllerAdvice
public class GlobalExceptionHandler {

    // This method will handle ResourceNotFoundException specifically
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        // Log the error details (optional but recommended)
        System.err.println("Resource Not Found: " + ex.getMessage());
        // You could create a dedicated ErrorDetails class for a structured response body
        // ErrorDetails errorDetails = new ErrorDetails(new Date(), ex.getMessage(), request.getDescription(false));
        // return new ResponseEntity<>(errorDetails, HttpStatus.NOT_FOUND);

        // For simplicity now, return the exception message directly with 404 status
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND); // HTTP 404
    }

    // You can add handlers for other exceptions here later
    // Example: Handling all other exceptions
    /*
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex, WebRequest request) {
        System.err.println("An unexpected error occurred: " + ex.getMessage());
        return new ResponseEntity<>("An internal error occurred", HttpStatus.INTERNAL_SERVER_ERROR); // HTTP 500
    }
    */
}