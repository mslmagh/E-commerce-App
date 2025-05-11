import { Routes } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { PaymentComponent } from './payment/payment.component';
import { SelectAddressComponent } from './select-address/select-address.component';
import { authGuard } from '../../core/guards/auth.guard';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    component: SelectAddressComponent,
    canActivate: [authGuard]
  },
  {
    path: 'new-address',
    component: CheckoutComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payment/:orderId',
    component: PaymentComponent,
    canActivate: [authGuard]
  }
];
