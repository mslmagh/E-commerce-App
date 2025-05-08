// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; // AuthService yolunuzu kontrol edin

export const adminGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userRole = authService.getUserRole(); // Kullanıcının rolünü al

  console.log('AdminGuard: Checking access. User Role:', userRole);

  if (authService.isLoggedIn() && userRole === 'ADMIN') {
    console.log('AdminGuard: Access granted.');
    return true; // Giriş yapmış ve rolü ADMIN ise izin ver
  } else {
    console.log('AdminGuard: Access denied. Redirecting to login or homepage.');
    // Giriş yapmamışsa veya rolü ADMIN değilse
    // İsterseniz login'e yönlendirin, isterseniz ana sayfaya veya bir "yetkisiz erişim" sayfasına
    return router.createUrlTree(['/auth/login']); // Login'e yönlendir
  }
};
