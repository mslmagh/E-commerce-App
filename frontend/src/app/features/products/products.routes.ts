// frontend/src/app/features/products/products.routes.ts
import { Routes } from '@angular/router';
import { ProductDetailComponent } from './product-detail/product-detail.component';

export const PRODUCT_ROUTES: Routes = [
  {
    path: ':id', // Dinamik ID parametresi
    component: ProductDetailComponent
  }
  // İleride ProductListComponent için { path: '', component: ProductListComponent } eklenebilir
];
