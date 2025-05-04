// frontend/src/app/features/checkout/checkout.routes.ts
import { Routes } from '@angular/router';
import { CheckoutComponent } from './checkout.component';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '', // Ana '/checkout' yolu doğrudan CheckoutComponent'i yüklesin
    component: CheckoutComponent
  }
];
