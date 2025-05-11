package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AdminUserViewDto;
import com.example.ecommerce.dto.UserRoleUpdateRequestDto;
import com.example.ecommerce.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin: User Management", description = "API endpoints for administrators to manage users")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserController.class);
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

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
            @ApiResponse(responseCode = "400", description = "Invalid request data (e.g., malformed JSON, or enabled status missing/invalid when parsed manually)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/{userId}/status")
    public ResponseEntity<AdminUserViewDto> updateUserStatus(
            @Parameter(description = "ID of the user whose status is to be updated", required = true) @PathVariable Long userId,
            @org.springframework.web.bind.annotation.RequestBody String requestBodyString) throws JsonProcessingException {

        logger.info("[Controller-TEST] Entered updateUserStatus for user ID: {}. Raw Request Body String: {}", userId, requestBodyString);
        AdminUserViewDto updatedUser = null;
        boolean manuallyParsedEnabledValue = false;

        try {
            Map<String, Object> bodyMap = objectMapper.readValue(requestBodyString, Map.class);
            
            if (bodyMap.containsKey("enabled") && bodyMap.get("enabled") instanceof Boolean) {
                manuallyParsedEnabledValue = (Boolean) bodyMap.get("enabled");
                logger.info("[Controller-TEST] Manually parsed 'enabled' value: {} for user ID: {}", manuallyParsedEnabledValue, userId);
            } else {
                logger.warn("[Controller-TEST] 'enabled' field not found in request body, not a boolean, or request body is not a valid JSON object. Body: {}. Setting enabled to false by default.", requestBodyString);
            }
            
            updatedUser = userService.updateUserEnabledStatus(userId, manuallyParsedEnabledValue);
            logger.info("[Controller-TEST] Successfully called service with manually parsed value ({}) for user ID: {}", manuallyParsedEnabledValue, userId);
            return ResponseEntity.ok(updatedUser);

        } catch (JsonProcessingException e_json) {
            logger.error("[Controller-TEST] JSON PARSING EXCEPTION for user ID: {}. Body String: '{}', Exception Type: {}, Exception Message: {}", 
                         userId, requestBodyString, e_json.getClass().getName(), e_json.getMessage());
            throw e_json;
        } catch (Exception e) {
            logger.error("[Controller-TEST] GENERAL EXCEPTION (non-JSON parsing) for user ID: {}. Body String: '{}', Exception: ", userId, requestBodyString, e);
            throw e;
        }
    }
}