// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
// inject fonksiyonunu Angular'dan import ediyoruz (fonksiyon içinde servis kullanmak için)
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
// AuthService'i import ediyoruz (token'ı almak için)
import { AuthService } from '../services/auth.service';

// Interceptor fonksiyonumuzu export ediyoruz
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,  // Yakalanan HTTP isteği
  next: HttpHandlerFn          // İsteği zincirdeki bir sonraki işleyiciye ileten fonksiyon
  ): Observable<HttpEvent<unknown>> => { // Geriye bir Observable<HttpEvent> döndürmeli

  // AuthService örneğini inject fonksiyonu ile alıyoruz
  const authService = inject(AuthService);
  // AuthService'den mevcut token'ı alıyoruz
  const authToken = authService.getToken();

  // Eğer bir token bulunduysa...
  if (authToken) {
    // Orijinal isteği klonluyoruz çünkü istekler değiştirilemez (immutable).
    // Klonlarken header'ları modifiye ediyoruz.
    const clonedReq = req.clone({
      // setHeaders ile yeni header ekleyebilir veya var olanı güncelleyebiliriz
      setHeaders: {
        // Standart JWT gönderim formatı: 'Bearer <token>'
        Authorization: `Bearer ${authToken}`
      }

    });
    console.log('AuthInterceptor: Token mevcut, Authorization header eklendi.'); // Yardımcı log
    // Modifiye edilmiş (klonlanmış) isteği zincirdeki bir sonraki adıma gönderiyoruz
    return next(clonedReq);
  } else {
    // Eğer token yoksa (kullanıcı giriş yapmamışsa veya token silinmişse)
    console.log('AuthInterceptor: Token yok, istek değiştirilmeden gönderiliyor.'); // Yardımcı log
    // Orijinal isteği değiştirmeden zincirdeki bir sonraki adıma gönderiyoruz
    return next(req);
  }
};
