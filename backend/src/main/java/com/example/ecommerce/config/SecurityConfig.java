package com.example.ecommerce.config; // Bu paketin doğruluğunu kontrol edin!

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// ===> YENİ IMPORT <===
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Mevcut filterChain bean'i - İÇİNİ DEĞİŞTİRECEĞİZ
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println(">>> SecurityConfig filterChain metodu CALISTI! <<<");

        http
            .authorizeHttpRequests(authorize -> authorize
                // ===> Swagger yollarını buradan KALDIRIN <===
                // .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Diğer API yolları için permitAll kalabilir
                .requestMatchers("/api/status").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(withDefaults());

        return http.build();
    }

    // ===> BU YENİ BEAN'İ EKLEYİN <===
    // Belirli yollar için (genellikle statik kaynaklar) web güvenliğini tamamen görmezden gelmek için kullanılır.
    // İstekler Spring Security filtre zincirine hiç girmez.
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**");
    }
}