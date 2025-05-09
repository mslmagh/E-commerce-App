package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AdminUserViewDto;
import com.example.ecommerce.dto.UserRoleUpdateRequestDto;
import com.example.ecommerce.dto.UserStatusUpdateRequestDto;
import com.example.ecommerce.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin: User Management", description = "API endpoints for administrators to manage users")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @Autowired
    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "List all users")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of users",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = AdminUserViewDto.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping
    public ResponseEntity<List<AdminUserViewDto>> getAllUsers() {
        List<AdminUserViewDto> users = userService.getAllUsersForAdmin();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Get user by ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user details",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AdminUserViewDto.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserViewDto> getUserById(
            @Parameter(description = "ID of the user to retrieve", required = true, example = "1") @PathVariable Long userId) {
        AdminUserViewDto userDto = userService.getUserByIdForAdmin(userId);
        return ResponseEntity.ok(userDto);
    }

    @Operation(summary = "Update user roles", description = "Updates the roles for a specific user. Requires ADMIN role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User roles updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AdminUserViewDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data (e.g., role not found, empty roles set)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User or Role not found")
    })
    @PutMapping("/{userId}/roles")
    public ResponseEntity<AdminUserViewDto> updateUserRoles(
            @Parameter(description = "ID of the user whose roles are to be updated", required = true) @PathVariable Long userId,
            @Valid @RequestBody UserRoleUpdateRequestDto roleUpdateRequestDto) {
        AdminUserViewDto updatedUser = userService.updateUserRoles(userId, roleUpdateRequestDto.getRoles());
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Update user account status", description = "Enables or disables a user's account. Requires ADMIN role.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User account status updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AdminUserViewDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid request data (e.g., enabled status is null)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/{userId}/status")
    public ResponseEntity<AdminUserViewDto> updateUserStatus(
            @Parameter(description = "ID of the user whose status is to be updated", required = true) @PathVariable Long userId,
            @Valid @RequestBody UserStatusUpdateRequestDto statusUpdateRequestDto) {
        AdminUserViewDto updatedUser = userService.updateUserEnabledStatus(userId, statusUpdateRequestDto.isEnabled());
        return ResponseEntity.ok(updatedUser);
    }
}