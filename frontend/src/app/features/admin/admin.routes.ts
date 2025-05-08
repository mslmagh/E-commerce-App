// src/app/features/admin/admin.routes.ts
// SON HALİ

import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
// import { adminGuard } from '../../core/guards/admin.guard'; // Oluşturunca eklenecek
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent, // Ana layout bu
    canActivate: [authGuard /*, adminGuard */], // Guard'ları ekle
    children: [
      {
        path: 'dashboard', // /admin/dashboard
        loadComponent: () => import('./dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users', // /admin/users
        loadComponent: () => import('./users/admin-user-list/admin-user-list.component').then(m => m.AdminUserListComponent)
      },
      {
        path: 'products', // /admin/products
        loadComponent: () => import('./products/admin-product-list/admin-product-list.component').then(m => m.AdminProductListComponent)
      },
      {
        path: 'orders', // /admin/orders
        loadComponent: () => import('./orders/admin-order-list/admin-order-list.component').then(m => m.AdminOrderListComponent)
      },
      // { path: 'settings', ... },
      // { path: 'users/:id', ... }, // Kullanıcı detayı vb. ileride eklenecek
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // /admin -> /admin/dashboard
    ]
  }
];
