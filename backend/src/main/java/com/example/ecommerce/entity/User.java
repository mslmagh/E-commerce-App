package com.example.ecommerce.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique username for login
    @Column(nullable = false, unique = true)
    private String username;

    // Encoded password
    @Column(nullable = false)
    private String password;

    // Optional email
    private String email;

    // If the user account is enabled
    private boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable( name = "user_roles",
                joinColumns = @JoinColumn(name = "user_id"),
                inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    // Adres ilişkisi - SADECE @OneToMany olmalı
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Address> addresses = new ArrayList<>();

    public User() {
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
    public List<Address> getAddresses() { return addresses; }
    public void setAddresses(List<Address> addresses) { this.addresses = addresses; }

   

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
            .map(role -> (GrantedAuthority) role::getName)
            .toList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // You can customize later
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // You can customize later
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // You can customize later
    }

    public void addAddress(Address address) {
        this.addresses.add(address);
        address.setUser(this);
    }
}
