package com.example.ecommerce.service;

import com.example.ecommerce.dto.AddressDto;
import com.example.ecommerce.dto.AddressRequestDto; // Use renamed DTO
import com.example.ecommerce.entity.Address;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private static final Logger logger = LoggerFactory.getLogger(AddressService.class);

    @Autowired private AddressRepository addressRepository;
    @Autowired private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AddressDto> getAddressesForCurrentUser() {
        User currentUser = getCurrentAuthenticatedUserEntity();
        // Only return active addresses
        return addressRepository.findByUserIdAndActiveTrue(currentUser.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDto addAddressToCurrentUser(AddressRequestDto requestDto) { // Use AddressRequestDto
        User currentUser = getCurrentAuthenticatedUserEntity();
        Address address = new Address();
        mapDtoToEntity(requestDto, address); // Use renamed DTO
        address.setUser(currentUser);
        address.setActive(true); // Set as active by default
        Address savedAddress = addressRepository.save(address);
        return convertToDto(savedAddress);
    }

    @Transactional(readOnly = true)
    public AddressDto getAddressByIdForCurrentUser(Long addressId) {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Address address = findAddressByIdAndCheckOwnership(addressId, currentUser);
        // Check if address is active
        if (!address.isActive()) {
            throw new ResourceNotFoundException("Address not found with id: " + addressId);
        }
        return convertToDto(address);
    }

    @Transactional
    public AddressDto updateAddressForCurrentUser(Long addressId, AddressRequestDto requestDto) { // Use AddressRequestDto
        User currentUser = getCurrentAuthenticatedUserEntity();
        Address existingAddress = findAddressByIdAndCheckOwnership(addressId, currentUser);
        // Check if address is active
        if (!existingAddress.isActive()) {
            throw new ResourceNotFoundException("Address not found with id: " + addressId);
        }
        mapDtoToEntity(requestDto, existingAddress); // Use renamed DTO
        Address updatedAddress = addressRepository.save(existingAddress);
        return convertToDto(updatedAddress);
    }

    @Transactional
    public void deleteAddressForCurrentUser(Long addressId) {
        try {
            User currentUser = getCurrentAuthenticatedUserEntity();
            Address address = findAddressByIdAndCheckOwnership(addressId, currentUser);
            
            logger.info("Soft deleting address with ID: {} for user: {}", addressId, currentUser.getUsername());
            
            // Instead of physically deleting, mark as inactive
            address.setActive(false);
            addressRepository.save(address);
            
            logger.info("Successfully soft deleted (deactivated) address with ID: {}", addressId);
        } catch (Exception e) {
            logger.error("Error while soft deleting address with ID: {}", addressId, e);
            throw e; // Rethrow the exception for global exception handler to handle
        }
    }

    // --- Helper Methods ---

    private User getCurrentAuthenticatedUserEntity() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
                 .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
     }

    private Address findAddressByIdAndCheckOwnership(Long addressId, User currentUser) {
         Address address = addressRepository.findById(addressId)
                 .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        // Check ownership
        if (!address.getUser().getId().equals(currentUser.getId())) {
             // Optional: Allow ADMINs to access/modify/delete any address? Add isAdmin check if needed.
             throw new AccessDeniedException("You are not authorized to access or modify this address.");
        }
        return address;
    }

    private void mapDtoToEntity(AddressRequestDto dto, Address address) { // Use AddressRequestDto
        address.setPhoneNumber(dto.getPhoneNumber());
        address.setCountry(dto.getCountry());
        address.setCity(dto.getCity());
        address.setPostalCode(dto.getPostalCode());
        address.setAddressText(dto.getAddressText());
    }

    private AddressDto convertToDto(Address address) {
        return new AddressDto(
                address.getId(),
                address.getPhoneNumber(),
                address.getCountry(),
                address.getCity(),
                address.getPostalCode(),
                address.getAddressText(),
                (address.getUser() != null) ? address.getUser().getId() : null,
                address.isActive()
        );
    }
}