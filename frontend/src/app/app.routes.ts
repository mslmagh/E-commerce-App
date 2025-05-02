import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },

  {
    path: 'favorites',
    loadChildren: () => import('./features/favorites/favorites.routes').then(r => r.FAVORITES_ROUTES)

  }

];
