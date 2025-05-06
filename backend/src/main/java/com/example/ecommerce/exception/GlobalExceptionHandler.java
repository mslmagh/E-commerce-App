package com.example.ecommerce.exception;

import com.example.ecommerce.dto.ErrorResponseDto; // Import ErrorResponseDto
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException; // Import AccessDeniedException
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException; // Import validation exception
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest; // Import ServletWebRequest
import org.springframework.web.context.request.WebRequest;

import java.util.stream.Collectors; // Import Collectors

@ControllerAdvice // Or @RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Handle Resource Not Found (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleResourceNotFoundException(ResourceNotFoundException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("ResourceNotFoundException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // Handle Validation Errors (@Valid) (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDto> handleValidationExceptions(MethodArgumentNotValidException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        // Collect all field errors into a single message string
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        String message = "Validation failed: " + errors;
        logger.warn("MethodArgumentNotValidException: {} at path {}", message, path);

        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Error",
                message,
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Handle Illegal Argument / Bad Input (400)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDto> handleIllegalArgumentException(IllegalArgumentException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("IllegalArgumentException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(), // Use the message from the exception (e.g., "Insufficient stock...")
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // Handle Access Denied (403) - Catches service layer AccessDeniedException
    // Note: @PreAuthorize failures might need a custom AccessDeniedHandler in
    // SecurityConfig for detailed JSON response
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDto> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("AccessDeniedException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                ex.getMessage(), // Use message from exception
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponseDto> handleBadCredentialsException(BadCredentialsException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        // Log the specific internal message, but return a generic one to the client
        logger.warn("BadCredentialsException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.UNAUTHORIZED.value(), // 401 status
                "Unauthorized",
                "Invalid username or password provided.", // Client için daha net mesaj
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    // Handle Generic Exceptions (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGlobalException(Exception ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        // Log the full stack trace for unexpected errors
        logger.error("Unexpected error occurred at path {}: {}", path, ex.getMessage(), ex);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred. Please contact support.", // Generic message for client
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

     @ExceptionHandler(AccountStatusException.class) // DisabledException, LockedException vb. yakalar
    public ResponseEntity<ErrorResponseDto> handleAccountStatusException(AccountStatusException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("AccountStatusException: {} at path {}", ex.getMessage(), path); // Örn: "User is disabled"
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.UNAUTHORIZED.value(), // veya 403 Forbidden da düşünülebilir, ama 401 daha yaygın
                "Account Access Denied",         // "Hesap Erişimi Reddedildi"
                ex.getMessage(),                 // Direkt Spring Security'nin mesajını kullanır (örn: "User is disabled")
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
}