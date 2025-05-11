package com.example.ecommerce.controller.webhook;

import com.example.ecommerce.service.OrderService; // Import OrderService
import com.stripe.exception.SignatureVerificationException; // Import Stripe exceptions
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook; // Import Webhook utility
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*; // Import general annotations

@RestController
@RequestMapping("/api/webhooks/stripe")
public class StripeWebhookController {
    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    @Autowired
    private OrderService orderService;

    /**
     * Handle Stripe webhooks to process payment events
     */
    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {

        logger.info("Received Stripe webhook");

        Event event;
        try {
            // Verify and construct the Event from payload and signature
            event = Webhook.constructEvent(payload, signatureHeader, webhookSecret);
            logger.info("Verified webhook signature: {}", event.getId());
        } catch (SignatureVerificationException e) {
            logger.error("Invalid Stripe webhook signature: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        }

        // Get the event type
        logger.info("Processing Stripe event: {}", event.getType());

        // Process the event based on its type
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = null;
        PaymentIntent paymentIntent = null;

        if (dataObjectDeserializer.getObject().isPresent()) {
            stripeObject = dataObjectDeserializer.getObject().get();
            logger.info("Stripe object type: {}", stripeObject.getClass().getName());
        } else {
            logger.warn("Couldn't deserialize event object: {}", event.getId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Could not deserialize event data");
        }

        // Handle each event type
        switch (event.getType()) {
            case "payment_intent.succeeded":
                if (stripeObject instanceof PaymentIntent) {
                    paymentIntent = (PaymentIntent) stripeObject;
                    logger.info("PaymentIntent Succeeded: {}", paymentIntent.getId());
                    try {
                        // Call OrderService to update order status
                        orderService.handlePaymentSucceeded(paymentIntent.getId());
                    } catch (Exception e) {
                        logger.error("Error handling payment_intent.succeeded for PI ID {}: {}",
                                paymentIntent.getId(), e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Error updating order status.");
                    }
                } else {
                    logger.warn(
                            "Webhook warning: Received payment_intent.succeeded event but data object is not a PaymentIntent: {}",
                            stripeObject);
                }
                break;
            case "payment_intent.payment_failed":
                if (stripeObject instanceof PaymentIntent) {
                    paymentIntent = (PaymentIntent) stripeObject;
                    logger.warn("PaymentIntent Failed: {}", paymentIntent.getId());
                    try {
                        // Call OrderService to handle failed payment
                        orderService.handlePaymentFailed(paymentIntent.getId());
                    } catch (Exception e) {
                        logger.error("Error handling payment_intent.payment_failed for PI ID {}: {}",
                                paymentIntent.getId(), e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body("Error updating order status.");
                    }
                } else {
                    logger.warn(
                            "Webhook warning: Received payment_intent.payment_failed event but data object is not a PaymentIntent: {}",
                            stripeObject);
                }
                break;
            // Add other event types to handle here if needed (e.g., charge.refunded)
            default:
                logger.info("Unhandled Stripe event type: {}", event.getType());
        }

        // Acknowledge receipt of the event to Stripe
        return ResponseEntity.ok("Webhook Received");
    }
}