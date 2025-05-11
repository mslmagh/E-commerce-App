package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AddressDto;
import com.example.ecommerce.dto.AddressRequestDto;
import com.example.ecommerce.service.AddressService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/my-addresses")
@Tag(name = "Address Management API", description = "API endpoints for managing user addresses")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("isAuthenticated()")
public class AddressController {

    private static final Logger logger = LoggerFactory.getLogger(AddressController.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private AddressService addressService;

    @Operation(summary = "Get My Addresses")
    @GetMapping
    public ResponseEntity<List<AddressDto>> getMyAddresses() {
        List<AddressDto> addresses = addressService.getAddressesForCurrentUser();
        return ResponseEntity.ok(addresses);
    }

    @Operation(summary = "Get My Address by ID")
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressDto> getMyAddressById(@PathVariable Long addressId) {
        AddressDto addressDto = addressService.getAddressByIdForCurrentUser(addressId);
        return ResponseEntity.ok(addressDto);
    }

    @Operation(summary = "Add New Address",
               requestBody = @RequestBody(
                       description = "Address data to create", required = true,
                       content = @Content(schema = @Schema(implementation = AddressRequestDto.class))
               )
    )
    @PostMapping
    public ResponseEntity<AddressDto> addMyAddress(@Valid @org.springframework.web.bind.annotation.RequestBody AddressRequestDto requestDto) {
        try {
            logger.info("Received POST request with JSON: {}", objectMapper.writeValueAsString(requestDto));
        } catch (JsonProcessingException e) {
            logger.error("Error serializing request DTO: {}", e.getMessage());
        }
        
        AddressDto createdAddress = addressService.addAddressToCurrentUser(requestDto);
         URI location = ServletUriComponentsBuilder
            .fromCurrentRequest().path("/{id}")
            .buildAndExpand(createdAddress.getId()).toUri();
        return ResponseEntity.created(location).body(createdAddress);
    }

    @Operation(summary = "Update My Address",
               requestBody = @RequestBody(
                       description = "Updated address data", required = true,
                       content = @Content(schema = @Schema(implementation = AddressRequestDto.class))
               )
    )
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDto> updateMyAddress(
            @PathVariable Long addressId,
            @Valid @org.springframework.web.bind.annotation.RequestBody AddressRequestDto requestDto) {
        // Log the request DTO to see what's being received
        try {
            logger.info("Received PUT request to /my-addresses/{} with JSON: {}", 
                    addressId, objectMapper.writeValueAsString(requestDto));
            logger.info("DTO values - phoneNumber: '{}', country: '{}', city: '{}', postalCode: '{}', addressText: '{}'", 
                    requestDto.getPhoneNumber(), requestDto.getCountry(), requestDto.getCity(), 
                    requestDto.getPostalCode(), requestDto.getAddressText());
        } catch (JsonProcessingException e) {
            logger.error("Error serializing request DTO: {}", e.getMessage());
        }
        
        AddressDto updatedAddress = addressService.updateAddressForCurrentUser(addressId, requestDto);
        return ResponseEntity.ok(updatedAddress);
    }

    @Operation(summary = "Delete My Address")
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteMyAddress(@PathVariable Long addressId) {
        try {
            logger.info("Received DELETE request for address ID: {}", addressId);
            addressService.deleteAddressForCurrentUser(addressId);
            logger.info("Successfully deleted address with ID: {}", addressId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting address with ID {}: {}", addressId, e.getMessage(), e);
            throw e; // Rethrow to let global exception handler deal with it
        }
    }
}