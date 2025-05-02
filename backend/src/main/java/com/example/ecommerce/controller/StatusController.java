package com.example.ecommerce.controller; // Paket adı sizin yapınıza uygun

import com.ecommerce.dto.StatusDto; // Oluşturduğumuz DTO'yu import ediyoruz
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status") // Endpoint'in ana yolu
public class StatusController {

    @GetMapping // GET isteklerini bu metot karşılayacak (Tam yol: /api/status)
    public ResponseEntity<StatusDto> getStatus() {
        // StatusDto nesnesi oluşturup durumu "OK" olarak ayarlıyoruz
        StatusDto responseDto = new StatusDto("OK");
        // DTO'yu ve HTTP 200 (OK) durumunu içeren bir ResponseEntity döndürüyoruz
        return ResponseEntity.ok(responseDto);
    }
}