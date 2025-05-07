
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // Bu satır olmalı

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
  },
  {
    path: 'about',

    loadChildren: () => import('./pages/about-us/about-us.routes').then(r => r.ABOUT_US_ROUTES)
  },
  { path: 'contact', loadChildren: () => import('./pages/contact/contact.routes').then(r => r.CONTACT_ROUTES) },
  { path: 'faq', loadChildren: () => import('./pages/faq/faq.routes').then(r => r.FAQ_ROUTES) },
  { path: 'returns', loadChildren: () => import('./pages/returns/returns.routes').then(r => r.RETURNS_ROUTES) },
  { path: 'shipping', loadChildren: () => import('./pages/shipping/shipping.routes').then(r => r.SHIPPING_ROUTES) },
  { path: 'privacy', loadChildren: () => import('./pages/privacy-policy/privacy-policy.routes').then(r => r.PRIVACY_POLICY_ROUTES) },
  { path: 'terms', loadChildren: () => import('./pages/terms/terms.routes').then(r => r.TERMS_ROUTES) },
  { path: 'cookies', loadChildren: () => import('./pages/cookies/cookies.routes').then(r => r.COOKIES_ROUTES) },
  { path: 'distance-sales', loadChildren: () => import('./pages/distance-sales/distance-sales.routes').then(r => r.DISTANCE_SALES_ROUTES) },
  {
    path: 'social-responsibility',
    loadChildren: () => import('./pages/social-responsibility/social-responsibility.routes').then(r => r.SOCIAL_RESPONSIBILITY_ROUTES)
  },
  {
    path: 'search',
    loadChildren: () => import('./features/search/search.routes').then(r => r.SEARCH_ROUTES)
  },
  {
    path: 'profile', // Adres /profile olacak
    // Oluşturduğumuz profile.routes.ts dosyasını yükle
    loadChildren: () => import('./features/profile/profile.routes').then(r => r.PROFILE_ROUTES),
    // Bu rotaya erişimden önce authGuard çalışsın
    canActivate: [authGuard]
  },
  {
    path: 'seller', // /seller ile başlayan tüm yollar
    loadChildren: () => import('./features/seller/seller.routes').then(r => r.SELLER_ROUTES), // Yeni oluşturduğumuz dosyayı yükle
    canActivate: [authGuard] // Satıcı paneline giriş için genel bir guard (Rol kontrolü de eklenecek)
  },
  // Diğer rotalar veya '**' rotası buraya eklenebilir...
];
