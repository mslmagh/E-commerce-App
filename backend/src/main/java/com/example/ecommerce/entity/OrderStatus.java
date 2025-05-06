package com.example.ecommerce.entity; // Or enums package

public enum OrderStatus {
    PENDING,        // Sipariş alındı, ödeme/işlem bekleniyor
    PROCESSING,     // Ödeme başarılı, sipariş hazırlanıyor <<<--- YENİ EKLENDİ
    PAYMENT_FAILED, // Ödeme başarısız oldu <<<--- YENİ EKLENDİ
    PREPARING,      // Satıcı hazırlıyor (PROCESSING ile birleştirilebilir veya ayrı kullanılabilir)
    SHIPPED,        // Kargoya verildi
    DELIVERED,      // Teslim edildi
    CANCELLED       // İptal edildi
}