
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { adminGuard } from '../../core/guards/admin.guard'; // adminGuard import edildiğinden emin olun
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard], // Hem giriş hem admin rolü kontrolü
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },

      {
        path: 'users', // Kullanıcı Listesi
        loadComponent: () =>
          import('./users/admin-user-list/admin-user-list.component').then(
            (m) => m.AdminUserListComponent
          ),
      },
      {
        path: 'users/:userId', // Kullanıcı Detay/Düzenleme (Placeholder)
        loadComponent: () =>
          import('./users/admin-user-detail/admin-user-detail.component').then(
            (m) => m.AdminUserDetailComponent
          ),
      },

      {
        path: 'products', // Admin Ürün Listesi (Az önce oluşturduk)
        loadComponent: () =>
          import('./products/admin-product-list/admin-product-list.component').then(
            (m) => m.AdminProductListComponent
          ),
      },
      {
        path: 'products/new', // <-- YENİ: Admin Yeni Ürün Ekleme Rotası
        loadComponent: () =>
          import('./products/admin-product-form/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent
          ),
      },
      {
        path: 'products/edit/:productId', // <-- YENİ: Admin Ürün Düzenleme Rotası (parametre ile)
         loadComponent: () =>
          import('./products/admin-product-form/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent
          ),
      },

      {
        path: 'orders', // Admin Sipariş Listesi
        loadComponent: () =>
          import('./orders/admin-order-list/admin-order-list.component').then(
            (m) => m.AdminOrderListComponent
          ),
      },
      {
        path: 'orders/:orderId', // Admin Sipariş Detayı (Placeholder)
        loadComponent: () =>
          import('./orders/admin-order-detail/admin-order-detail.component').then(
            (m) => m.AdminOrderDetailComponent
          ),
      },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
