// frontend/src/app/core/guards/auth.guard.ts
// YORUMSUZ HAL

import { inject } from '@angular/core'; // inject fonksiyonu
import { CanActivateFn, Router, UrlTree } from '@angular/router'; // Gerekli Router sınıfları
import { AuthService } from '../services/auth.service'; // Kendi servisimiz (YOLU KONTROL ET!)
// import { Observable } from 'rxjs'; // Observable döndürmeyeceğiz şimdilik

// Fonksiyonel CanActivate guard'ı tanımı
export const authGuard: CanActivateFn = (route, state) => {

  // Gerekli servisleri fonksiyon içinde inject ile alıyoruz
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking access for route:', state.url); // Hangi sayfaya gidilmeye çalışıldığını logla

  // AuthService'deki isLoggedIn metodunu kullanarak kontrol yap
  if (authService.isLoggedIn()) {
    console.log('AuthGuard: Access granted.');
    return true; // Kullanıcı giriş yapmış, sayfaya erişime izin ver
  } else {
    console.log('AuthGuard: Access denied, user not logged in. Redirecting to login.');
    // Kullanıcı giriş yapmamışsa:
    // 1. Login sayfasına yönlendir.
    // 2. Kullanıcının gitmeye çalıştığı asıl adresi (state.url) returnUrl parametresi olarak
    //    login sayfasına gönderelim ki, başarılı girişten sonra oraya geri dönebilsin.
    // 3. router.navigate() yerine UrlTree döndürmek guard'larda daha iyi bir pratiktir.
    const urlTree: UrlTree = router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return urlTree; // Yönlendirmeyi gerçekleştir ve erişimi engelle
  }
};
