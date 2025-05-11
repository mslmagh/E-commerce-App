import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const sellerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userRole$.pipe(
    map(role => {
      if (authService.isLoggedIn() && role === 'ROLE_SELLER') {
        return true;
      }
      console.warn('SellerGuard: Access denied. User is not a seller or not logged in.');
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
}; 