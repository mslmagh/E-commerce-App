
import { inject } from '@angular/core'; // inject fonksiyonu
import { CanActivateFn, Router, UrlTree } from '@angular/router'; // Gerekli Router sınıfları
import { AuthService } from '../services/auth.service'; // Kendi servisimiz (YOLU KONTROL ET!)

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking access for route:', state.url); // Hangi sayfaya gidilmeye çalışıldığını logla

  if (authService.isLoggedIn()) {
    console.log('AuthGuard: Access granted.');
    return true; // Kullanıcı giriş yapmış, sayfaya erişime izin ver
  } else {
    console.log('AuthGuard: Access denied, user not logged in. Redirecting to login.');
    const urlTree: UrlTree = router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return urlTree;
  }
};
