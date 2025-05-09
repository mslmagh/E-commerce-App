import { Routes } from '@angular/router';
import { CheckoutComponent } from './checkout.component';
import { PaymentComponent } from './payment/payment.component'; // Yeni component'i import edin
import { authGuard } from '../../core/guards/auth.guard'; // Kullanıcı giriş kontrolü için

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    component: CheckoutComponent, // '/checkout' -> Adres formu
    canActivate: [authGuard] // Adres sayfasına erişim için giriş yapmış olmalı
  },
  {
    path: 'payment',
    component: PaymentComponent, // '/checkout/payment' -> Ödeme sayfası
    canActivate: [authGuard] // Ödeme sayfasına erişim için de giriş yapmış olmalı
  }
  // İleride sipariş onay sayfası için '/checkout/confirmation' gibi bir rota eklenebilir
];
