package com.example.ecommerce.controller;

import com.example.ecommerce.dto.UserProfileDto;
import com.example.ecommerce.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.example.ecommerce.dto.UpdateUserProfileRequestDto;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "User Profile API", description = "API endpoints for managing user profile information")
@SecurityRequirement(name = "bearerAuth") // Assuming bearerAuth is defined in your OpenAPI config
public class ProfileController {

    private final UserService userService;

    @Autowired
    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current user profile", description = "Fetches the profile information of the currently authenticated user.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved user profile", 
                 content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserProfileDto.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized if user is not authenticated")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile() {
        UserProfileDto userProfile = userService.getCurrentUserProfile();
        return ResponseEntity.ok(userProfile);
    }
    
    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update current user profile", description = "Updates the profile information of the currently authenticated user.")
    @ApiResponse(responseCode = "200", description = "Successfully updated user profile", 
                 content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserProfileDto.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @ApiResponse(responseCode = "401", description = "Unauthorized if user is not authenticated")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserProfileDto> updateCurrentUserProfile(@Valid @RequestBody UpdateUserProfileRequestDto updateUserProfileRequestDto) {
        UserProfileDto updatedUserProfile = userService.updateCurrentUserProfile(updateUserProfileRequestDto);
        return ResponseEntity.ok(updatedUserProfile);
    }
} 