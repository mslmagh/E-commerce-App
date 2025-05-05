package com.example.ecommerce.config;

import com.stripe.Stripe; // Import Stripe class
import jakarta.annotation.PostConstruct; // Import PostConstruct
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    // Inject the secret key from application.properties
    @Value("${stripe.secret.key}")
    private String secretKey;

    // This method runs once after the bean is initialized
    @PostConstruct
    public void initStripe() {
        Stripe.apiKey = this.secretKey;
        // Optionally set API version (check Stripe documentation)
        // Stripe.setApiVersion("YYYY-MM-DD");
        System.out.println("Stripe API Key Initialized."); // Log for confirmation
    }
}