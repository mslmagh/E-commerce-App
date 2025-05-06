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
@RequestMapping("/api/webhooks") // Base path for webhooks
public class StripeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${stripe.webhook.secret}") // Inject webhook secret from properties
    private String endpointSecret;

    @Autowired
    private OrderService orderService; // Inject OrderService to update order status

    @PostMapping("/stripe") // Endpoint path Stripe will send events to
    public ResponseEntity<String> handleStripeEvent(@RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        // Check if webhook secret is configured
        if (endpointSecret == null) {
            logger.error("Webhook error: Stripe webhook secret is not configured.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook secret not configured.");
        }

        Event event;

        try {
            // Verify the webhook signature and construct the event object
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            logger.info("Stripe Webhook Event Received: ID: {}, Type: {}", event.getId(), event.getType());

        } catch (SignatureVerificationException e) {
            // Invalid signature
            logger.warn("Webhook error while validating signature: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            logger.error("Webhook error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook processing error");
        }

        // Deserialize the nested object inside the event
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = null;
        if (dataObjectDeserializer.getObject().isPresent()) {
            stripeObject = dataObjectDeserializer.getObject().get();
        } else {
            // Deserialization failed, probably due to API version mismatch
            logger.warn(
                    "Webhook warning: Event data object deserialization failed for event type: {}. Check Stripe API version.",
                    event.getType());
            // We probably still received the event, so acknowledge it
            return ResponseEntity.ok("Received but data deserialization failed.");
        }

        // Handle the event based on its type
        PaymentIntent paymentIntent = null;
        switch (event.getType()) {
            case "payment_intent.succeeded":
                if (stripeObject instanceof PaymentIntent) {
                    paymentIntent = (PaymentIntent) stripeObject;
                    logger.info("PaymentIntent Succeeded: {}", paymentIntent.getId());
                    try {
                        String targetPaymentIntentId = "pi_3RLjNhQQxJ0jyreu1BkSsiNl"; // <<<--- KENDİ SİPARİŞİNİZİN PI ID'SİNİ YAPIŞTIRIN
                        logger.info("Attempting to update order status for hardcoded PI ID: {}", targetPaymentIntentId);
                        orderService.handlePaymentSucceeded(paymentIntent.getId());
                    } catch (Exception e) {
                        logger.error("Error handling payment_intent.succeeded for PI ID {}: {}", paymentIntent.getId(),
                                e.getMessage(), e);
                        // Return 500 but Stripe might retry if it doesn't get 200
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