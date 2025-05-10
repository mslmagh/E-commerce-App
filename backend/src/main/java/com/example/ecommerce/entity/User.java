package com.example.ecommerce.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority; // Ensure this import exists
import org.springframework.security.core.userdetails.UserDetails;
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory

import java.util.*; // Import Set, List, HashSet, ArrayList, Collection
import java.util.stream.Collectors; // Import Collectors

@Entity
// Add unique constraints if email/username should be unique at DB level
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "username"),
           @UniqueConstraint(columnNames = "email")
       })
public class User implements UserDetails {

    private static final Logger logger = LoggerFactory.getLogger(User.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50) // Specify length
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, length = 80) // Specify length for email
    private String email;

    @Column(length = 50)
    private String firstName;

    @Column(length = 50)
    private String lastName;

    @Column(length = 20) // Consider if it should be unique
    private String phoneNumber;

    // ===> YENİ ALAN: Vergi Numarası (Sadece Satıcılar için anlamlı) <===
    @Column(name = "tax_id", length = 20) // Tax ID, nullable, specify length
    private String taxId;
    // ===> YENİ ALAN SONU <===

    private boolean enabled = true;

    @ManyToMany(fetch = FetchType.EAGER, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable( name = "user_roles",
                joinColumns = @JoinColumn(name = "user_id"),
                inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Address> addresses = new ArrayList<>();

    // Constructors
    public User() {}

    // Getters and Setters (including taxId)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    @Override public String getUsername() { return username; } // From UserDetails
    public void setUsername(String username) { this.username = username; }
    @Override public String getPassword() { return password; } // From UserDetails
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getTaxId() { return taxId; } // Getter for taxId
    public void setTaxId(String taxId) { this.taxId = taxId; } // Setter for taxId
    @Override public boolean isEnabled() { return enabled; } // From UserDetails
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }
    public List<Address> getAddresses() { return addresses; }
    public void setAddresses(List<Address> addresses) { this.addresses = addresses; }


    // --- UserDetails Methods Implementation ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<? extends GrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
        // logger.debug("User '{}' has authorities: {}", this.username, authorities); // Keep if debugging needed
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Default to true
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Default to true
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Default to true
    }

    // --- Helper Methods ---
     public void addAddress(Address address) {
         if (this.addresses == null) {
             this.addresses = new ArrayList<>();
         }
         this.addresses.add(address);
         address.setUser(this);
     }
}