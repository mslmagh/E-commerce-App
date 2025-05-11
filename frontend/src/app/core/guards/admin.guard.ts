import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; // AuthService yolunuzu kontrol edin
import { map } from 'rxjs/operators'; // Import map operator
import { Observable } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userRole$.pipe(
    map(role => {
      console.log('AdminGuard: Checking access. User Role from observable:', role);
      if (authService.isLoggedIn() && role === 'ROLE_ADMIN') {
        console.log('AdminGuard: Access granted.');
        return true; // Giriş yapmış ve rolü ADMIN ise izin ver
      } else {
        console.log('AdminGuard: Access denied. Redirecting to login or homepage.');
        // Redirect to login, preserving the intended URL for redirection after login
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }
    })
  );
};
