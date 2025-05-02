package com.example.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // HttpMethod'ı import etmeyi unutmayın
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer; // <<<--- BU IMPORT'U SİLİN
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println(">>> SecurityConfig filterChain metodu CALISTI! (WebSecurityCustomizer KALDIRILDI) <<<");

        http
            .authorizeHttpRequests(authorize -> authorize
                // ===> Swagger yollarını TEKRAR BURAYA EKLEYİN <===
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Diğer izinler
                .requestMatchers("/api/status").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                // Geri kalan her şey kimlik doğrulaması gerektirsin
                .anyRequest().authenticated()
            )
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(withDefaults());

        return http.build();
    }

    // ===> BU BEAN'İ TAMAMEN SİLİN VEYA YORUM SATIRI YAPIN <===
    /*
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**");
    }
    */
}