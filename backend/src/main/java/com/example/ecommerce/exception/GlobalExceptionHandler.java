// src/main/java/com/example/ecommerce/exception/GlobalExceptionHandler.java
package com.example.ecommerce.exception;

import com.example.ecommerce.dto.ErrorResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory; // LoggerFactory import edildiğinden emin olun
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Logger instance'ı sınıf seviyesinde tanımlanmalı
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
                ex.getMessage(),
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponseDto> handleIllegalStateException(IllegalStateException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("IllegalStateException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.CONFLICT.value(),
                "Data Conflict",
                ex.getMessage(),
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleDataIntegrityViolationException(DataIntegrityViolationException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("DataIntegrityViolationException at path {}: {}", path, ex.getMessage(), ex);
        
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.CONFLICT.value(),
                "Data Integrity Violation",
                "The operation could not be completed because it would violate data integrity constraints. This usually happens when a record is referenced by other records.",
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponseDto> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("AccessDeniedException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                ex.getMessage(),
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponseDto> handleBadCredentialsException(BadCredentialsException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("BadCredentialsException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "Invalid username or password provided.",
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    // Handle Generic Exceptions (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> handleGlobalException(Exception ex, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        // ÖNEMLİ DEĞİŞİKLİK: Tam stack trace'i loglayın
        logger.error("Unexpected error occurred at path {}: {}", path, ex.getMessage(), ex); // 'ex' parametresini loglamaya ekleyin
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred. Please contact support.",
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

     @ExceptionHandler(AccountStatusException.class)
    public ResponseEntity<ErrorResponseDto> handleAccountStatusException(AccountStatusException ex,
            WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        logger.warn("AccountStatusException: {} at path {}", ex.getMessage(), path);
        ErrorResponseDto errorResponse = new ErrorResponseDto(
                HttpStatus.UNAUTHORIZED.value(),
                "Account Access Denied",
                ex.getMessage(),
                path);
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
}