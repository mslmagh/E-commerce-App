
import { Routes } from '@angular/router';

import { HomepageComponent } from './features/homepage/homepage.component';

export const routes: Routes = [


  { path: '', component: HomepageComponent },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },

  { // Mevcut Favorites Rotası
    path: 'favorites',
    loadChildren: () => import('./features/favorites/favorites.routes').then(r => r.FAVORITES_ROUTES)

  },
  {
    path: 'cart',
    // './features/cart/cart.routes' dosyasını ve içindeki CART_ROUTES'u yükle
    loadChildren: () => import('./features/cart/cart.routes').then(r => r.CART_ROUTES)
    // , canActivate: [authGuardFn] // Belki giriş gerektirir
  },
  {
    path: 'products',
    // './features/products/products.routes' dosyasını ve içindeki PRODUCT_ROUTES'u yükle
    loadChildren: () => import('./features/products/products.routes').then(r => r.PRODUCT_ROUTES)
  },
  {
    path: 'checkout', // '/checkout' adresi için
    loadChildren: () => import('./features/checkout/checkout.routes').then(r => r.CHECKOUT_ROUTES)
    // TODO: Bu rota kesinlikle giriş yapmış olmayı gerektirir! AuthGuard eklenecek.
    // , canActivate: [authGuardFn]
  }
  // Diğer rotalar veya '**' rotası buraya eklenebilir...
];
