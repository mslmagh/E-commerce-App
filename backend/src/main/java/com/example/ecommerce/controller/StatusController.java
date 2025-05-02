package com.example.ecommerce.controller;

import com.example.ecommerce.dto.StatusDto; // <<<--- BU SATIR OLMALI!
import io.swagger.v3.oas.annotations.Operation; // ===> Import ekle
import io.swagger.v3.oas.annotations.media.Content; // ===> Import ekle
import io.swagger.v3.oas.annotations.media.Schema; // ===> Import ekle
import io.swagger.v3.oas.annotations.responses.ApiResponse; // ===> Import ekle
import io.swagger.v3.oas.annotations.responses.ApiResponses; // ===> Import ekle
import io.swagger.v3.oas.annotations.tags.Tag; // ===> Import ekle
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
@Tag(name = "Status API", description = "Uygulamanın sağlık durumunu kontrol eden API") // ===> Controller'ı gruplandırmak için Tag ekle
public class StatusController {

    @Operation(summary = "API Durumunu Getir", description = "Backend API'nin çalışıp çalışmadığını kontrol eder.") // ===> Metot açıklaması ekle
    @ApiResponses(value = { // ===> Olası yanıtları tanımla
            @ApiResponse(responseCode = "200", description = "API başarıyla çalışıyor",
                    content = { @Content(mediaType = "application/json",
                            schema = @Schema(implementation = StatusDto.class)) }), // Başarılı yanıtta StatusDto döner
            @ApiResponse(responseCode = "500", description = "Sunucu hatası",
                    content = @Content) // Hata durumunda içerik boş olabilir
    })
    @GetMapping
    public ResponseEntity<StatusDto> getStatus() {
        StatusDto responseDto = new StatusDto("OK");
        return ResponseEntity.ok(responseDto);
    }
}