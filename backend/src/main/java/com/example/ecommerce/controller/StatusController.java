package com.example.ecommerce.controller;

import com.example.ecommerce.dto.StatusDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/status")
@Tag(name = "Status API", description = "Uygulamanın sağlık durumunu kontrol eden API")
public class StatusController {

    @Operation(summary = "API Durumunu Getir", description = "Backend API'nin çalışıp çalışmadığını kontrol eder.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "API başarıyla çalışıyor",
                    content = { @Content(mediaType = "application/json",
                            schema = @Schema(implementation = StatusDto.class)) }),
            @ApiResponse(responseCode = "500", description = "Sunucu hatası",
                    content = @Content)
    })
    @GetMapping
    public ResponseEntity<StatusDto> getStatus() {
        StatusDto responseDto = new StatusDto("OK");
        return ResponseEntity.ok(responseDto);
    }
}