package com.example.ecommerce.service;

// YENİ DTO
import com.example.ecommerce.dto.*; // Import all DTOs from package
// YENİ ENUM
import com.example.ecommerce.entity.*; // Import all Entities + OrderStatus
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.AddressRepository;
import com.example.ecommerce.repository.CartRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.repository.OrderItemRepository; // EKLENECEK
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication; // Import Authentication
import org.springframework.security.core.GrantedAuthority; // Import GrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Ensure this is imported
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Map; // EKLENECEK
import java.util.function.Function; // EKLENECEK
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Set; // Import Set for roles/authorities
import java.util.stream.Stream;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AddressRepository addressRepository;
    @Autowired
    private CartService cartService;
    @Autowired
    private ProductService productService;
    @Autowired
    private OrderItemRepository orderItemRepository;

    @Transactional // Bu metod veritabanını (Order entity) ve harici bir sistemi (Stripe)
                   // etkileyebilir
    public String processStripeRefund(String paymentIntentId, BigDecimal amountToRefund) throws StripeException {
        if (paymentIntentId == null || paymentIntentId.isBlank()) {
            logger.warn("PaymentIntent ID is null or empty. Cannot process refund.");
            throw new IllegalArgumentException("PaymentIntent ID is required to process a refund.");
        }
        if (amountToRefund == null || amountToRefund.compareTo(BigDecimal.ZERO) <= 0) {
            logger.warn("Invalid refund amount: {}", amountToRefund);
            throw new IllegalArgumentException("Refund amount must be greater than zero.");
        }

        // Stripe tutarları en küçük para birimi cinsinden (örn: kuruş) alır.
        // TRY için 100 ile çarpılmalı.
        long amountInKurus = amountToRefund.multiply(new BigDecimal("100")).longValueExact();

        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .setAmount(amountInKurus) // İade edilecek tutar (opsiyonel, belirtilmezse tamamı iade edilir)
                // .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER) // İade nedeni
                // (opsiyonel)
                .build();

        logger.info("Attempting to create Stripe refund for PaymentIntent ID: {}, Amount: {} kuruş", paymentIntentId,
                amountInKurus);
        Refund refund = Refund.create(params); // Stripe API çağrısı
        logger.info("Stripe refund successful. Refund ID: {}, Status: {}", refund.getId(), refund.getStatus());

        return refund.getId(); // Stripe tarafından verilen iade ID'sini döndür
    }

    @Transactional
    public OrderDto cancelFullOrder(Long orderId, String actorUsername, String reason) { // `reason` parametresi eklendi
                                                                                         // (opsiyonel)
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Actor (User) not found with username: " + actorUsername));
        Set<String> actorRoles = actor.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        boolean isAdmin = actorRoles.contains("ROLE_ADMIN");
        // boolean isSeller = actorRoles.contains("ROLE_SELLER"); // Satıcıların tüm
        // siparişi iptali artık bu metodla yapılmayacak.
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isOwner = order.getCustomer().getId().equals(actor.getId());

        // Admin Tüm Siparişi İptal ve İade Edebilir
        if (isAdmin) {
            logger.info("Admin {} initiating full cancellation and refund for order ID: {}", actorUsername, orderId);
            // Siparişteki tüm *aktif* kalemlerin ID'lerini topla
            List<Long> allActiveItemIds = order.getOrderItems().stream()
                    .filter(item -> item.getStatus() == OrderItemStatus.ACTIVE
                            || item.getStatus() == OrderItemStatus.SHIPPED)
                    .map(OrderItem::getId)
                    .collect(Collectors.toList());

            if (allActiveItemIds.isEmpty()) {
                // Eğer iptal/iade edilecek aktif kalem yoksa (belki hepsi zaten iptal edilmiş)
                // siparişin durumunu kontrol et ve gerekirse CANCELLED yap.
                if (order.getStatus() != OrderStatus.CANCELLED) {
                    order.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(order);
                    logger.info("No active items to refund in order ID {}. Order status set to CANCELLED by admin.",
                            orderId);
                } else {
                    logger.info("Order ID {} already cancelled. No action taken by admin for full cancel.", orderId);
                }
                return convertToDto(order);
            }

            CancelOrderItemsRequestDto requestDto = new CancelOrderItemsRequestDto();
            requestDto.setOrderItemIds(allActiveItemIds);
            requestDto.setReason(reason != null ? reason : "Full order cancellation by admin.");
            // cancelAndRefundOrderItemsByActor metodu artık iadeyi de hallediyor.
            return cancelAndRefundOrderItemsByActor(orderId, requestDto, actorUsername);
        }
        // Kullanıcı Kendi Siparişini Belirli Durumlarda İptal Edebilir (İadesiz)
        else if (isOwner) {
            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PREPARING) {
                logger.info("Owner {} cancelling order ID: {} (status: {}). No refund processed at this stage.",
                        actorUsername, orderId, order.getStatus());
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getStatus() == OrderItemStatus.ACTIVE) { // Sadece aktif olanları iptal et
                        item.setStatus(OrderItemStatus.CANCELLED);
                        orderItemRepository.save(item);
                        try {
                            productService.increaseStock(item.getProduct().getId(), item.getQuantity());
                        } catch (Exception e) {
                            logger.error(
                                    "CRITICAL: Failed to increase stock for product ID {} while owner cancelling order item ID {}. Error: {}",
                                    item.getProduct().getId(), item.getId(), e.getMessage(), e);
                        }
                    }
                }
                order.setStatus(OrderStatus.CANCELLED); // Siparişin genel durumunu da iptal et
                Order cancelledOrder = orderRepository.save(order);
                return convertToDto(cancelledOrder);
            } else {
                throw new IllegalStateException(
                        "Order cannot be cancelled by the owner at its current status: " + order.getStatus());
            }
        }
        // Diğer roller (örn: Satıcı) bu metodla tüm siparişi iptal edemez.
        else {
            throw new AccessDeniedException(
                    "User " + actorUsername + " is not authorized to cancel this entire order.");
        }
    }

    @Transactional
    public OrderDto cancelAndRefundOrderItemsByActor(Long orderId, CancelOrderItemsRequestDto requestDto,
            String actorUsername) {
        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Actor (User) not found with username: " + actorUsername));
        Set<String> actorRoles = actor.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        boolean isAdmin = actorRoles.contains("ROLE_ADMIN");
        boolean isSeller = actorRoles.contains("ROLE_SELLER");

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException(
                    "Order is already in a final state (CANCELLED/DELIVERED) and cannot be partially modified.");
        }

        // Check if a monetary refund can be attempted
        boolean canAttemptMonetaryRefund = true;
        if (order.getStripePaymentIntentId() == null || order.getStripePaymentIntentId().isBlank()) {
            logger.warn("Order ID: {} does not have a Payment Intent ID. Monetary refund will not be processed. Items will be cancelled.", orderId);
            canAttemptMonetaryRefund = false;
            // Do not throw an exception here, allow cancellation without monetary refund
        }

        List<Long> itemIdsToCancel = requestDto.getOrderItemIds();
        if (itemIdsToCancel == null || itemIdsToCancel.isEmpty()) {
            throw new IllegalArgumentException("No order item IDs provided for cancellation.");
        }

        // Siparişe ait olan ve henüz iptal/iade edilmemiş kalemleri al
        Map<Long, OrderItem> activeOrderItemsMap = order.getOrderItems().stream()
                .filter(item -> item.getStatus() == OrderItemStatus.ACTIVE
                        || item.getStatus() == OrderItemStatus.SHIPPED) // İptal edilebilir durumlar
                .collect(Collectors.toMap(OrderItem::getId, Function.identity()));

        BigDecimal totalAmountToRefund = BigDecimal.ZERO;
        List<OrderItem> itemsSuccessfullyProcessedForRefund = new ArrayList<>();

        for (Long itemId : itemIdsToCancel) {
            OrderItem item = activeOrderItemsMap.get(itemId);
            if (item == null) {
                logger.warn("OrderItem ID {} not found in order ID {} or already processed.", itemId, orderId);
                // İsteğe bağlı: burada bir hata fırlatılabilir veya sadece loglanıp devam
                // edilebilir.
                // Şimdilik devam edelim, olmayan veya zaten işlenmiş kalemleri atlayalım.
                continue;
            }

            // Yetki Kontrolü: Admin her kalemi iptal edebilir, Satıcı sadece kendi ürününü.
            if (!isAdmin) { // Eğer admin değilse, satıcı kontrolü yap
                if (!isSeller || !item.getProduct().getSeller().getId().equals(actor.getId())) {
                    logger.warn(
                            "Seller {} (ID: {}) is not authorized to cancel OrderItem ID {} (Product Seller ID: {}).",
                            actorUsername, actor.getId(), itemId, item.getProduct().getSeller().getId());
                    throw new AccessDeniedException(
                            "You are not authorized to cancel one or more of the selected items.");
                }
            }

            // İade edilecek tutara ekle (her bir kalemin fiyatı * miktarı)
            totalAmountToRefund = totalAmountToRefund
                    .add(item.getPriceAtPurchase().multiply(new BigDecimal(item.getQuantity())));
            itemsSuccessfullyProcessedForRefund.add(item);
        }

        if (itemsSuccessfullyProcessedForRefund.isEmpty()) {
            throw new IllegalArgumentException(
                    "None of the provided item IDs were valid for cancellation/refund in order " + orderId);
        }

        String stripeRefundId = null;
        if (totalAmountToRefund.compareTo(BigDecimal.ZERO) > 0 && canAttemptMonetaryRefund) {
            try {
                logger.info("Processing partial refund for order ID {}. Amount: {}. Items: {}",
                        orderId, totalAmountToRefund, itemsSuccessfullyProcessedForRefund.stream().map(OrderItem::getId)
                                .collect(Collectors.toList()));
                stripeRefundId = processStripeRefund(order.getStripePaymentIntentId(), totalAmountToRefund);

                // İade edilen toplam tutarı siparişte güncelle
                order.setTotalRefundedAmount(order.getTotalRefundedAmount().add(totalAmountToRefund));

            } catch (StripeException e) {
                logger.error("Stripe partial refund failed for order ID: {}. Amount: {}. Error: {}",
                        orderId, totalAmountToRefund, e.getMessage(), e);
                throw new RuntimeException("Stripe refund processing failed: " + e.getMessage(), e);
            }
        } else if (totalAmountToRefund.compareTo(BigDecimal.ZERO) > 0 && !canAttemptMonetaryRefund) {
            logger.info("Total amount for specified items is greater than zero for order ID {}, but monetary refund cannot be attempted (e.g. no Payment Intent ID). Items will be marked as CANCELLED.", orderId);
        } else {
            logger.info(
                    "Total amount to refund is zero for order ID {}. No Stripe refund will be processed. Items might be cancelled without monetary refund.",
                    orderId);
        }

        // Başarıyla iade için işlenen kalemlerin durumunu ve stoklarını güncelle
        for (OrderItem item : itemsSuccessfullyProcessedForRefund) {
            // If a Stripe refund was processed and successful, or if it was intended but couldn't be (e.g. no PI) but items are being cancelled.
            // Status should be REFUNDED if stripeRefundId is present, otherwise CANCELLED.
            item.setStatus((stripeRefundId != null) ? OrderItemStatus.REFUNDED : OrderItemStatus.CANCELLED);
            item.setStripeRefundId(stripeRefundId); 
            // Set refunded amount on item only if a monetary refund happened for this item through Stripe
            if (stripeRefundId != null) {
                item.setRefundedAmount(item.getPriceAtPurchase().multiply(new BigDecimal(item.getQuantity())));
            } else {
                item.setRefundedAmount(BigDecimal.ZERO); // No monetary refund for this item
            }
            orderItemRepository.save(item); // Her bir kalemi kaydet

            try {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity());
                logger.info("Stock increased for product ID {} by quantity {} due to item cancellation.",
                        item.getProduct().getId(), item.getQuantity());
            } catch (Exception e) {
                logger.error(
                        "CRITICAL: Failed to increase stock for product ID {} while cancelling order item ID {}. Error: {}",
                        item.getProduct().getId(), item.getId(), e.getMessage(), e);
            }
        }

        // Siparişin genel durumunu kontrol et ve güncelle
        updateOverallOrderStatus(order);

        Order savedOrder = orderRepository.save(order);
        logger.info("Order ID {} items ({}) cancelled/refunded by {}. Stripe Refund ID (if any): {}",
                orderId,
                itemsSuccessfullyProcessedForRefund.stream().map(OrderItem::getId).collect(Collectors.toList()),
                actorUsername, stripeRefundId);
        return convertToDto(savedOrder); // convertToDto'nun OrderItemDto'ları da içermesi ve OrderItemDto'nun yeni
                                         // alanları yansıtması gerekir.
    }

    private void updateOverallOrderStatus(Order order) {
        boolean allItemsCancelledOrRefunded = order.getOrderItems().stream()
                .allMatch(item -> item.getStatus() == OrderItemStatus.CANCELLED
                        || item.getStatus() == OrderItemStatus.REFUNDED);

        boolean anyItemActive = order.getOrderItems().stream()
                .anyMatch(item -> item.getStatus() == OrderItemStatus.ACTIVE ||
                        item.getStatus() == OrderItemStatus.SHIPPED); // veya teslim edilmemiş diğer aktif durumlar

        if (allItemsCancelledOrRefunded) {
            order.setStatus(OrderStatus.CANCELLED); // Veya FULLY_REFUNDED (eğer OrderStatus'ta varsa)
            logger.info("All items in order ID {} are cancelled/refunded. Order status set to CANCELLED.",
                    order.getId());
        } else if (!anyItemActive) {
            // Eğer aktif kalem kalmadıysa ama hepsi de iptal/iade edilmediyse (örn:
            // bazıları DELIVERED)
            // Bu durum projenizin mantığına göre yönetilmeli.
            // Şimdilik, eğer aktif kalem yoksa ve en az bir kalem iptal/iade edildiyse,
            // siparişin durumunu değiştirmeden loglayabiliriz veya özel bir durum (örn:
            // PARTIALLY_COMPLETED_REFUNDED) ekleyebiliriz.
            // Basitlik adına, eğer en az bir kalem iade/iptal edildiyse ve diğerleri de
            // nihai bir durumdaysa (örn: DELIVERED)
            // siparişin genel durumunu değiştirmek yerine OrderItem durumlarına
            // güvenebiliriz.
            // VEYA, OrderStatus'a PARTIALLY_REFUNDED, PARTIALLY_CANCELLED gibi durumlar
            // eklenebilir.
            boolean anyRefunded = order.getOrderItems().stream()
                    .anyMatch(oi -> oi.getStatus() == OrderItemStatus.REFUNDED);
            if (anyRefunded && !allItemsCancelledOrRefunded) {
                // order.setStatus(OrderStatus.PARTIALLY_REFUNDED); // Eğer böyle bir durum
                // varsa
                logger.info(
                        "Order ID {} has some items refunded and some in other states. Keeping current overall status or set to PARTIALLY_REFUNDED if defined.",
                        order.getId());
            }
        }
        // Eğer hala aktif kalemler varsa, siparişin genel durumu genellikle değişmez
        // (örn: PROCESSING, SHIPPED)
        // veya projenizin iş akışına göre güncellenir.
    }

    @Transactional
    public OrderDto createOrder(CreateOrderRequestDto requestDto) {
        User customer = getCurrentAuthenticatedUserEntity();
        Cart cart = cartService.findOrCreateCartForCurrentUser();

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            logger.warn("Attempt to create order from empty cart for user {}.", customer.getUsername());
            throw new IllegalArgumentException("Cannot create order from an empty cart.");
        }
        logger.info("Creating order for user {} from cart ID {}", customer.getUsername(), cart.getId());

        Address shippingAddress = addressRepository.findById(requestDto.getShippingAddressId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shipping address not found with id: " + requestDto.getShippingAddressId()));
        if (!shippingAddress.getUser().getId().equals(customer.getId())) {
            logger.warn("User {} attempted to use address ID {} which belongs to another user.", customer.getUsername(),
                    shippingAddress.getId());
            throw new AccessDeniedException("Shipping address does not belong to the current user.");
        }

        Order order = new Order();
        order.setCustomer(customer);
        order.setShippingAddress(shippingAddress);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> newOrderItems = new ArrayList<>();
        List<CartItem> itemsToProcess = new ArrayList<>(cart.getItems());

        for (CartItem cartItem : itemsToProcess) {
            Product product = cartItem.getProduct();
            int quantity = cartItem.getQuantity();
            Product currentProductState = productRepository.findById(product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product with id: " + product.getId() + " not found during order creation."));

            logger.debug("Checking stock for product ID {}. Requested: {}, Available: {}", currentProductState.getId(),
                    quantity, currentProductState.getStockQuantity());
            if (currentProductState.getStockQuantity() < quantity) {
                throw new IllegalArgumentException("Insufficient stock during checkout for product: "
                        + currentProductState.getName() + ". Requested: " + quantity + ", Available: "
                        + currentProductState.getStockQuantity());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(currentProductState);
            orderItem.setQuantity(quantity);
            orderItem.setPriceAtPurchase(currentProductState.getPrice());

            newOrderItems.add(orderItem);

            BigDecimal itemTotal = currentProductState.getPrice().multiply(new BigDecimal(quantity));
            totalAmount = totalAmount.add(itemTotal);
            logger.debug("Added item: Product ID {}, Qty: {}, Price: {}, ItemTotal: {}", product.getId(), quantity,
                    orderItem.getPriceAtPurchase(), itemTotal);
        }

        order.setTotalAmount(totalAmount);
        newOrderItems.forEach(order::addOrderItem);
        logger.info("Order calculated. Total Amount: {}, Item Count: {}", totalAmount, newOrderItems.size());

        Order savedOrder = orderRepository.save(order);
        logger.info("Order created successfully with ID: {}", savedOrder.getId());

        logger.debug("Decreasing stock for order ID: {}", savedOrder.getId());
        for (OrderItem savedItem : savedOrder.getOrderItems()) {
            try {
                productService.decreaseStock(savedItem.getProduct().getId(), savedItem.getQuantity());
            } catch (Exception e) {
                logger.error(
                        "CRITICAL: Failed to decrease stock for product ID {} for order ID {}. Manual correction needed! Error: {}",
                        savedItem.getProduct().getId(), savedOrder.getId(), e.getMessage(), e);
            }
        }

        logger.debug("Clearing cart ID: {} for user ID: {}", cart.getId(), customer.getId());
        try {
            cartService.clearCartForCurrentUser();
        } catch (Exception e) {
            logger.error("ERROR: Failed to clear cart for user ID {} after creating order ID {}. Error: {}",
                    customer.getId(), savedOrder.getId(), e.getMessage(), e);
        }

        logger.debug("Converting saved order ID: {} to DTO", savedOrder.getId());
        return convertToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getAllOrdersForAdmin(Pageable pageable, String customerUsername,
            OrderStatus status, LocalDate startDate, LocalDate endDate) {
        logger.debug(
                "Fetching all orders for admin with filters - Username: {}, Status: {}, StartDate: {}, EndDate: {}, Page: {}",
                customerUsername, status, startDate, endDate, pageable);

        Specification<Order> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (customerUsername != null && !customerUsername.isEmpty()) {
                // Join User entity and filter by username
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("customer").get("username")),
                        "%" + customerUsername.toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (startDate != null) {
                LocalDateTime startDateTime = startDate.atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("orderDate"), startDateTime));
            }
            if (endDate != null) {
                LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX); // Günün sonuna kadar
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("orderDate"), endDateTime));
            }
            // Siparişleri en yeniden eskiye doğru sırala (default)
            query.orderBy(criteriaBuilder.desc(root.get("orderDate")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        return orderPage.map(this::convertToDto); // Mevcut convertToDto'yu kullan
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderDetailsForAdmin(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        // Admin olduğu için ekstra yetki kontrolüne gerek yok, direkt tüm detayları
        // dönebiliriz.
        // convertToDto zaten gerekli bilgileri içeriyor. İstenirse daha fazla detay
        // eklenebilir.
        logger.debug("Fetching details for order ID {} for admin", orderId);
        return convertToDto(order);
    }

    @Transactional
    public OrderDto updateOrderStatusByAdmin(Long orderId, UpdateOrderStatusRequestDto requestDto) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus newStatus = requestDto.getNewStatus();
        logger.info("Admin attempting to update order ID {} from status {} to {}", orderId, order.getStatus(),
                newStatus);

        // Adminin hangi durumlara geçiş yapabileceğine dair kurallar eklenebilir.
        // Örneğin, DELIVERED olan bir siparişi tekrar PENDING yapmasına izin
        // verilmeyebilir.
        // Şimdilik adminin her duruma geçebileceğini varsayalım, CANCELLED hariç (onun
        // için /cancel endpointi var).
        if (newStatus == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Admin should use the /cancel endpoint to cancel orders, not status update.");
        }

        // Sipariş durumu CANCELLED ise ve yeni status CANCELLED değilse, stok iadesi
        // yapılmış olabilir.
        // Bu durumu yönetmek karmaşıklaşabilir. Şimdilik CANCELLED bir siparişin
        // durumunun değiştirilemeyeceğini varsayalım.
        if (order.getStatus() == OrderStatus.CANCELLED && newStatus != OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot change status of an already CANCELED order via this method.");
        }

        // Eğer yeni durum DELIVERED ise ve ödeme yapılmamışsa (örn:
        // StripePaymentIntentId boş veya ödeme başarısız)
        // bu bir sorun olabilir. Ödeme kontrolü eklenebilir.
        // if (newStatus == OrderStatus.DELIVERED && (order.getStripePaymentIntentId()
        // == null || order.getStatus() == OrderStatus.PAYMENT_FAILED)) {
        // throw new IllegalStateException("Cannot mark order as DELIVERED if payment
        // was not successful or initiated.");
        // }

        order.setStatus(newStatus);
        Order updatedOrder = orderRepository.save(order);
        logger.info("Order ID {} status updated to {} by admin.", orderId, newStatus);
        return convertToDto(updatedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForCurrentUser() {
        User customer = getCurrentAuthenticatedUserEntity();
        List<Order> orders = orderRepository.findByCustomerUsername(customer.getUsername());
        return orders.stream().map(this::convertToDto) /* Uses simple convertToDto for customer */ .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderByIdForCurrentUser(Long orderId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = getCurrentAuthenticatedUserEntity(authentication);
        Set<String> currentUserRoles = getUserRoles(authentication);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        boolean isAdmin = currentUserRoles.contains("ROLE_ADMIN");
        boolean isOwner = order.getCustomer().getId().equals(currentUser.getId());
        // boolean isSeller = currentUserRoles.contains("ROLE_SELLER"); // No longer needed here directly for decision

        if (isOwner || isAdmin) {
            // Owner and Admin see all items and original total
            return convertToDto(order); // Uses the simpler overload that shows all items
        }

        // If it's a seller, they must have a product in the order
        if (currentUserRoles.contains("ROLE_SELLER")) {
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            if (orderContainsSellersProduct) {
                // Seller sees only their items and their specific total
                return convertToDto(order, currentUser, currentUserRoles);
            }
        }
        throw new AccessDeniedException("You are not authorized to view this order.");
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersForSeller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User seller = getCurrentAuthenticatedUserEntity(authentication);
        Set<String> sellerRoles = getUserRoles(authentication); // Should predominantly be ROLE_SELLER

        List<Order> orders = orderRepository.findOrdersContainingProductFromSeller(seller.getId());
        return orders.stream()
                     .map(order -> convertToDto(order, seller, sellerRoles)) // Use new convertToDto for seller list
                     .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequestDto requestDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = getCurrentAuthenticatedUserEntity(authentication);
        Set<String> currentUserRoles = getUserRoles(authentication);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus newStatus = requestDto.getNewStatus();
        // Prevent setting CANCELLED via this method, use cancelOrder instead
        if (newStatus == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Please use the /cancel endpoint to cancel orders.");
        }

        boolean isAdmin = currentUserRoles.contains("ROLE_ADMIN");
        boolean isSeller = currentUserRoles.contains("ROLE_SELLER");

        if (isAdmin) {
            order.setStatus(newStatus);
        } else if (isSeller) {
            boolean orderContainsSellersProduct = order.getOrderItems().stream()
                    .anyMatch(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            if (!orderContainsSellersProduct) {
                throw new AccessDeniedException("Seller is not authorized to update status for this order.");
            }
            // Allow seller to set these statuses
            if (newStatus == OrderStatus.PREPARING || newStatus == OrderStatus.SHIPPED
                    || newStatus == OrderStatus.DELIVERED) {
                order.setStatus(newStatus);
            } else { // PENDING or other potentially invalid statuses for seller action
                throw new AccessDeniedException("Seller cannot set status to " + newStatus);
            }
        } else { // User is not ADMIN or relevant SELLER
            throw new AccessDeniedException("User is not authorized to update order status.");
        }

        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // --- Helper Methods ---
    // Overload or modify getCurrentAuthenticatedUserEntity to accept Authentication
    private User getCurrentAuthenticatedUserEntity() {
        return getCurrentAuthenticatedUserEntity(SecurityContextHolder.getContext().getAuthentication());
    }

    private User getCurrentAuthenticatedUserEntity(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Cannot get user details from unauthenticated context.");
        }
        Object principal = authentication.getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else if (principal != null) {
            username = principal.toString();
        } else {
            throw new IllegalStateException("Cannot get username from principal: Principal is null.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user '" + username + "' not found in database"));
    }

    // Helper to get roles/authorities as Strings from Authentication
    private Set<String> getUserRoles(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Set.of(); // Return empty set if not authenticated
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    // Overloaded convertToDto to filter items for seller
    private OrderDto convertToDto(Order order, User currentUser, Set<String> currentUserRoles) {
        List<OrderItemDto> itemDtos;
        if (order.getOrderItems() != null) {
            Stream<OrderItem> itemStream = order.getOrderItems().stream();

            if (currentUserRoles.contains("ROLE_SELLER") && !currentUserRoles.contains("ROLE_ADMIN")) {
                // If the current user is a SELLER (and not an ADMIN), filter items by seller ID
                itemStream = itemStream.filter(item -> item.getProduct().getSeller().getId().equals(currentUser.getId()));
            }
            itemDtos = itemStream.map(this::convertItemToDto).collect(Collectors.toList());
        } else {
            itemDtos = new ArrayList<>();
        }

        // Recalculate totalAmount for the seller based on filtered items
        BigDecimal sellerSpecificTotalAmount = BigDecimal.ZERO;
        if (currentUserRoles.contains("ROLE_SELLER") && !currentUserRoles.contains("ROLE_ADMIN")) {
            for (OrderItemDto itemDto : itemDtos) {
                // priceAtPurchase should be per unit. Multiply by quantity.
                sellerSpecificTotalAmount = sellerSpecificTotalAmount.add(itemDto.getPriceAtPurchase().multiply(new BigDecimal(itemDto.getQuantity())));
            }
        } else {
            sellerSpecificTotalAmount = order.getTotalAmount(); // Admins and customers see the original total
        }

        AddressDto shippingAddressDto = (order.getShippingAddress() != null)
                ? convertAddressToDto(order.getShippingAddress())
                : null;
        return new OrderDto(
                order.getId(),
                order.getOrderDate(),
                order.getStatus(),
                sellerSpecificTotalAmount, // Use seller-specific total amount
                order.getCustomer().getId(),
                order.getCustomer().getUsername(),
                itemDtos, // Filtered or all items
                shippingAddressDto,
                order.getStripePaymentIntentId());
    }

    // Original convertToDto for contexts where filtering is not needed or handled differently (e.g. admin views all)
    private OrderDto convertToDto(Order order) {
         // For simplicity, let's assume we always want to pass the current user if available
         // However, this might require fetching the user even if not strictly necessary for this specific overload.
         // A better approach might be to have the calling methods decide which convertToDto to call.
         // For now, let's make this one call the new one with nulls, implying no specific filtering by default.
         // OR, even better, make the methods that need filtering call the new one explicitly.

        // Defaulting to no specific user context for this simpler overload
        List<OrderItemDto> itemDtos = (order.getOrderItems() != null)
                ? order.getOrderItems().stream().map(this::convertItemToDto).collect(Collectors.toList())
                : new ArrayList<>();
        AddressDto shippingAddressDto = (order.getShippingAddress() != null)
                ? convertAddressToDto(order.getShippingAddress())
                : null;
        return new OrderDto(
                order.getId(), order.getOrderDate(), order.getStatus(), order.getTotalAmount(), // Original total amount
                order.getCustomer().getId(), order.getCustomer().getUsername(), itemDtos, // All items
                shippingAddressDto,
                order.getStripePaymentIntentId());
    }

    private OrderItemDto convertItemToDto(OrderItem item) {
        return new OrderItemDto(
                item.getId(),
                (item.getProduct() != null) ? item.getProduct().getId() : null,
                (item.getProduct() != null) ? item.getProduct().getName() : null,
                item.getQuantity(),
                item.getPriceAtPurchase(),
                item.getStatus() != null ? item.getStatus().name() : null,
                item.getStripeRefundId(),
                item.getRefundedAmount());
    }

    private AddressDto convertAddressToDto(Address address) {
        if (address == null)
            return null;
        return new AddressDto(
                address.getId(), address.getPhoneNumber(), address.getCountry(), address.getCity(),
                address.getPostalCode(), address.getAddressText(),
                (address.getUser() != null) ? address.getUser().getId() : null);
    }

    @Transactional // Modifies order by saving paymentIntentId
    public PaymentIntentDto createPaymentIntent(Long orderId) throws StripeException {
        User currentUser = getCurrentAuthenticatedUserEntity();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Authorization check: Only the order owner (or admin) can create payment
        // intent
        boolean isAdmin = getUserRoles(SecurityContextHolder.getContext().getAuthentication()).contains("ROLE_ADMIN");
        if (!order.getCustomer().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new AccessDeniedException("You are not authorized to process payment for this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Payment cannot be initiated for order with status: " + order.getStatus());
        }

        long amountInKurus = order.getTotalAmount().multiply(new BigDecimal("100")).longValueExact();
        String currency = "try"; // Or get from config/order details

        // --- Create Stripe Payment Intent ---
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInKurus)
                .setCurrency(currency)
                // Enable automatic payment methods (recommended by Stripe)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
                // Add metadata (optional but useful)
                .putMetadata("order_id", order.getId().toString())
                .putMetadata("customer_username", order.getCustomer().getUsername())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        logger.info("Created PaymentIntent ID: {} for Order ID: {}", paymentIntent.getId(), orderId);

        // Save the PaymentIntent ID to the order (important for tracking/webhooks)
        order.setStripePaymentIntentId(paymentIntent.getId());
        orderRepository.save(order);

        // Return only the client secret to the frontend
        return new PaymentIntentDto(paymentIntent.getClientSecret());
    }

    @Transactional
    public void handlePaymentSucceeded(String paymentIntentId) {
        logger.info("Webhook received: Payment Succeeded for PI ID: {}", paymentIntentId);
        // Bu metot OrderRepository'de olmalı: findByStripePaymentIntentId
        Optional<Order> orderOpt = orderRepository.findByStripePaymentIntentId(paymentIntentId);

        if (orderOpt.isEmpty()) {
            logger.error("Webhook error: No order found for successful PaymentIntent ID: {}", paymentIntentId);
            return;
        }
        Order order = orderOpt.get();
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.PROCESSING); // Veya PAID
            orderRepository.save(order);
            logger.info("Order ID: {} status updated to {} due to successful payment.", order.getId(),
                    order.getStatus());
        } else {
            logger.warn(
                    "Webhook warning: Received payment_intent.succeeded for Order ID: {} which is already in status: {}.",
                    order.getId(), order.getStatus());
        }
    }

    @Transactional
    public void handlePaymentFailed(String paymentIntentId) {
        logger.info("Webhook received: Payment Failed for PI ID: {}", paymentIntentId);
        Optional<Order> orderOpt = orderRepository.findByStripePaymentIntentId(paymentIntentId);

        if (orderOpt.isEmpty()) {
            logger.error("Webhook error: No order found for failed PaymentIntent ID: {}", paymentIntentId);
            return;
        }
        
        Order order = orderOpt.get();
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
            logger.info("Order ID: {} status updated to {} due to failed payment.", order.getId(),
                    order.getStatus());
        } else {
            logger.warn(
                    "Webhook warning: Received payment_intent.failed for Order ID: {} which is already in status: {}.",
                    order.getId(), order.getStatus());
        }
    }
}