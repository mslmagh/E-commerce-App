import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { HomepageComponent } from './features/homepage/homepage.component';
import { adminGuard } from './core/guards/admin.guard';
import { sellerGuard } from './core/guards/seller.guard';

export const routes: Routes = [
  { path: '', component: HomepageComponent },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES)
  },

  {
    path: 'favorites',
    loadChildren: () => import('./features/favorites/favorites.routes').then(r => r.FAVORITES_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(r => r.ADMIN_ROUTES),
    canActivate: [authGuard , adminGuard ]
  },

  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then(r => r.CART_ROUTES)
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(r => r.PRODUCT_ROUTES)
  },
  {
    path: 'checkout',
    loadChildren: () => import('./features/checkout/checkout.routes').then(r => r.CHECKOUT_ROUTES)
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
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(r => r.PROFILE_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'seller',
    loadChildren: () => import('./features/seller/seller.routes').then(r => r.SELLER_ROUTES),
    canActivate: [authGuard, sellerGuard]
  }
];
