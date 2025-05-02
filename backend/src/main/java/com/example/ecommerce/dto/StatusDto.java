package com.ecommerce.dto; // Paket adı sizin yapınıza uygun

public class StatusDto {

    private String status;

    // Boş yapıcı metot (JSON dönüşümü için gerekli olabilir)
    public StatusDto() {
    }

    // Durumu ayarlayan yapıcı metot
    public StatusDto(String status) {
        this.status = status;
    }

    // Getter metodu (JSON dönüşümü için gerekli)
    public String getStatus() {
        return status;
    }

    // Setter metodu (opsiyonel, ama genellikle eklenir)
    public void setStatus(String status) {
        this.status = status;
    }
}