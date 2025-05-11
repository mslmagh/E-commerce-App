import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { SellerRegistrationComponent } from './components/seller-registration/seller-registration.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'seller-register', component: SellerRegistrationComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
