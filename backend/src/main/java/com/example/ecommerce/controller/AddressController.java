package com.example.ecommerce.controller;

import com.example.ecommerce.dto.AddressDto;
import com.example.ecommerce.dto.AddressRequestDto;
import com.example.ecommerce.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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

    @Autowired
    private AddressService addressService;

    @Operation(summary = "Get My Addresses")
    @ApiResponses(value = { /* ... */ })
    @GetMapping
    public ResponseEntity<List<AddressDto>> getMyAddresses() {
        List<AddressDto> addresses = addressService.getAddressesForCurrentUser();
        return ResponseEntity.ok(addresses);
    }

    @Operation(summary = "Get My Address by ID")
    @ApiResponses(value = { /* ... */ })
    @GetMapping("/{addressId}")
    public ResponseEntity<AddressDto> getMyAddressById(@PathVariable Long addressId) {
        AddressDto addressDto = addressService.getAddressByIdForCurrentUser(addressId);
        return ResponseEntity.ok(addressDto);
    }


    @Operation(summary = "Add New Address",
               // ===> Define RequestBody INSIDE @Operation <===
               requestBody = @RequestBody(
                       description = "Address data to create", required = true,
                       content = @Content(schema = @Schema(implementation = AddressRequestDto.class))
               )
    )
    // Remove the separate @RequestBody annotation here
    @ApiResponses(value = { /* ... */ })
    @PostMapping
    public ResponseEntity<AddressDto> addMyAddress(@Valid @org.springframework.web.bind.annotation.RequestBody AddressRequestDto requestDto) {
        AddressDto createdAddress = addressService.addAddressToCurrentUser(requestDto);
         URI location = ServletUriComponentsBuilder
            .fromCurrentRequest().path("/{id}")
            .buildAndExpand(createdAddress.getId()).toUri();
        return ResponseEntity.created(location).body(createdAddress);
    }

    @Operation(summary = "Update My Address",
               // ===> Define RequestBody INSIDE @Operation <===
               requestBody = @RequestBody(
                       description = "Updated address data", required = true,
                       content = @Content(schema = @Schema(implementation = AddressRequestDto.class))
               )
    )
    // Remove the separate @RequestBody annotation here
    @ApiResponses(value = { /* ... */ })
    @PutMapping("/{addressId}")
    public ResponseEntity<AddressDto> updateMyAddress(
            @PathVariable Long addressId,
            @Valid @org.springframework.web.bind.annotation.RequestBody AddressRequestDto requestDto) {
        AddressDto updatedAddress = addressService.updateAddressForCurrentUser(addressId, requestDto);
        return ResponseEntity.ok(updatedAddress);
    }

    @Operation(summary = "Delete My Address")
    @ApiResponses(value = { /* ... */ })
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteMyAddress(@PathVariable Long addressId) {
        addressService.deleteAddressForCurrentUser(addressId);
        return ResponseEntity.noContent().build();
    }
}