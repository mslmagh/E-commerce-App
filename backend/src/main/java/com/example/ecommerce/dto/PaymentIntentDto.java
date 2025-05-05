package com.example.ecommerce.dto;

import io.swagger.v3.oas.annotations.media.Schema;

// DTO to return the client secret for the PaymentIntent
public class PaymentIntentDto {

    @Schema(description = "The client secret needed by Stripe.js/frontend to complete the payment",
            example = "pi_123abc_secret_XYZ789")
    private String clientSecret;

    public PaymentIntentDto(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public PaymentIntentDto() {} // Default constructor

    // Getter and Setter
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
}