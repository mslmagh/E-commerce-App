// src/app/features/seller/seller.routes.ts
// "Seller" ön ekli ve doğru yollu component adlarına göre güncellenmiş son hali

import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { SellerLayoutComponent } from './layout/seller-layout/seller-layout.component';

export const SELLER_ROUTES: Routes = [
  {
    path: '',
    component: SellerLayoutComponent,
    canActivate: [authGuard],
    // TODO: Rol bazlı guard da eklenmeli (sadece SELLER rolü girebilsin)
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './dashboard/seller-dashboard/seller-dashboard.component' // Dosya yolu
          ).then((m) => m.SellerDashboardComponent), // Sınıf adı
      },
      {
        path: 'products', // Bu, SellerProductListComponent'i yükleyecek
        loadComponent: () =>
          import(
            './products/seller-product-list/seller-product-list.component' // Dosya yolu
          ).then((m) => m.SellerProductListComponent), // Sınıf adı
      },
      {
        path: 'products/new', // Yeni ürün ekleme formu
        loadComponent: () =>
          import(
            './products/seller-product-form/seller-product-form.component' // Dosya yolu
          ).then((m) => m.SellerProductFormComponent), // Sınıf adı
      },
      {
        path: 'products/edit/:productId', // Ürün düzenleme formu
        loadComponent: () =>
          import(
            './products/seller-product-form/seller-product-form.component' // Dosya yolu (Aynı formu kullanıyoruz)
          ).then((m) => m.SellerProductFormComponent), // Sınıf adı
      },
      {
        path: 'orders', // Bu, SellerOrderListComponent'i yükleyecek
        loadComponent: () =>
          import(
            './orders/seller-order-list/seller-order-list.component' // Dosya yolu
          ).then((m) => m.SellerOrderListComponent), // Sınıf adı
      },
      {
        path: 'orders/:orderId', // Sipariş detayı
        loadComponent: () =>
          import(
            './orders/seller-order-detail/seller-order-detail.component' // Dosya yolu
          ).then((m) => m.SellerOrderDetailComponent), // Sınıf adı
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    ],
  },
];
