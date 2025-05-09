package com.example.ecommerce.config;

import com.example.ecommerce.security.jwt.AuthTokenFilter;
import com.example.ecommerce.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// WebSecurityCustomizer import ve bean'i olmadığından emin olun
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration; // YENİ IMPORT
import org.springframework.web.cors.CorsConfigurationSource; // YENİ IMPORT
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // YENİ IMPORT
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays; // YENİ IMPORT
import java.util.List; // YENİ IMPORT

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    // unauthorizedHandler bean'i tanımlı değilse bu alanı ve kullanan yeri
    // yorumlayın
    // @Autowired
    // private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200")); // Angular uygulamanızın adresi
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration
                .setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true); // Cookie veya Authorization header'ları için önemli
        configuration.setMaxAge(3600L); // 1 saat

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration); // API endpointleriniz için CORS'u etkinleştir
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
        .cors(cors -> cors.configurationSource(corsConfigurationSource())) // <<<--- YENİ EKLENEN SATIR (CORS'u etkinleştir)
                .csrf(AbstractHttpConfigurer::disable) // CSRF Kapatıldı
                // Hata Yönetimi Giriş Noktası (Eğer özel bir handler'ınız yoksa yorumlayın)
                // .exceptionHandling(exception ->
                // exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // STATELESS
                                                                                                              // Session
                .authorizeHttpRequests(authorize -> authorize
                        // İzin Verilen Public Endpointler
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/status").permitAll()
                        .requestMatchers("/api/webhooks/stripe").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        // Diğer tüm istekler kimlik doğrulaması gerektirir
                        // (Spesifik rol kontrolleri @PreAuthorize ile yapılıyor)
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider()) // <<<--- ÖNEMLİ: Provider'ı KAYDET
                .addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class) // JWT
                                                                                                             // Filtresini
                                                                                                             // EKLE
        ; // Zincirin sonu

        return http.build();
    }

    // WebSecurityCustomizer bean'inin olmadığından emin olun
}