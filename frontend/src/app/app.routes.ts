
import { Routes } from '@angular/router';

import { HomepageComponent } from './features/homepage/homepage.component';

export const routes: Routes = [


  { path: '', component: HomepageComponent }, // <-- DEĞİŞİKLİK

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },

  { // Mevcut Favorites Rotası
    path: 'favorites',
    loadChildren: () => import('./features/favorites/favorites.routes').then(r => r.FAVORITES_ROUTES)

  }

  // Diğer rotalar veya '**' rotası buraya eklenebilir...
];
