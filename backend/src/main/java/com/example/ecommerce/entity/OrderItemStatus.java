package com.example.ecommerce.entity;

public enum OrderItemStatus {
    ACTIVE,                 // Kalem aktif, işlenmeyi bekliyor veya işlendi
    PENDING_CANCELLATION,   // Kullanıcı/Satıcı/Admin tarafından iptal istendi
    CANCELLED,              // İptal edildi (iade yapılmadı veya gerekmedi)
    REFUND_PROCESSING,      // İade işlemi Stripe'a gönderildi, onay bekleniyor
    REFUNDED,               // İade başarıyla tamamlandı
    DELIVERED,              // Bu kalem teslim edildi (eğer kalem bazlı teslimat takibi varsa)
    SHIPPED                 // Bu kalem kargoya verildi (eğer kalem bazlı kargo takibi varsa)
}