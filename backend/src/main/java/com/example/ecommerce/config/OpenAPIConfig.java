package com.example.ecommerce.config; // Paket adınızın doğru olduğundan emin olun

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration // Bu sınıfın bir Spring yapılandırma sınıfı olduğunu belirtir
@OpenAPIDefinition(
    // API'nin genel bilgilerini burada tanımlayabiliriz (application.properties yerine)
    info = @Info(
        title = "E-Ticaret Projesi API",
        version = "v0.0.1",
        description = "Bu API, E-Ticaret projesinin backend servislerini sağlar."
        // İsterseniz iletişim, lisans gibi bilgileri de buraya ekleyebilirsiniz
        // contact = @Contact(...),
        // license = @License(...)
    ),
    // Güvenlik gereksinimini global olarak tanımlıyoruz (yani kilit ikonu her yerde görünsün)
    // İsmi aşağıdaki @SecurityScheme'deki 'name' ile eşleşmeli
    security = {
        @SecurityRequirement(name = "bearerAuth")
    }
)
// Kullanacağımız güvenlik şemasını (JWT Bearer) tanımlıyoruz
@SecurityScheme(
    name = "bearerAuth",                // Bu şemaya verdiğimiz isim (yukarıdaki SecurityRequirement ile eşleşir)
    type = SecuritySchemeType.HTTP,     // Tip: HTTP tabanlı kimlik doğrulama
    scheme = "bearer",                  // Şema: Bearer token
    bearerFormat = "JWT"                // Bearer token formatı: JWT
)
public class OpenAPIConfig {
    // Bu sınıfın içi boş kalabilir, tüm yapılandırma yukarıdaki anotasyonlarla yapıldı.
    // Alternatif olarak @Bean OpenAPI metodu ile de yapılabilirdi ama bu daha okunaklı.
}