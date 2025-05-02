package com.example.ecommerce.config; // Bu satırın doğruluğunu TEKRAR KONTROL EDİN!

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Çalıştığını görmek için bu satırı SİLMEDEN bırakalım
        System.out.println(">>> SecurityConfig filterChain metodu CALISTI! <<<");

        http
            .authorizeHttpRequests(authorize -> authorize
                // İzin verdiğimiz yollar aynı kalıyor
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/status").permitAll()
                // Diğer her şey kimlik doğrulaması istesin
                .anyRequest().authenticated()
            )
            .csrf(AbstractHttpConfigurer::disable)
            // ===> DEĞİŞİKLİK BURADA: formLogin'i kaldırıp httpBasic'i deneyelim <===
            // .formLogin(withDefaults()) // Bu satırı yorum satırı yapın veya silin
            .httpBasic(withDefaults()); // Sadece httpBasic kalsın

        return http.build();
    }
}