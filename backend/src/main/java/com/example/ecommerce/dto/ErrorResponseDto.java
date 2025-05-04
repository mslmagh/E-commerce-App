package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List; // Import List if using fieldErrors

@Schema(description = "Standard error response format")
public class ErrorResponseDto {

    @Schema(description = "Timestamp when the error occurred")
    private LocalDateTime timestamp;
    @Schema(description = "HTTP status code", example = "404")
    private int status;
    @Schema(description = "Short error code or reason phrase", example = "Not Found")
    private String error;
    @Schema(description = "Detailed error message explaining the issue", example = "Resource not found with the specified ID")
    private String message;
    @Schema(description = "The path where the error occurred", example = "/api/products/99")
    private String path;
    // Optional: Add a field for validation errors
    // private List<String> fieldErrors;

    // Constructor
    public ErrorResponseDto(int status, String error, String message, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    // Getters (Setters usually not needed)
    public LocalDateTime getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getPath() { return path; }
}