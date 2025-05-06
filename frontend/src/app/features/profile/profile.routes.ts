// frontend/src/app/features/profile/profile.routes.ts
// TEKRAR KONTROL - YORUMSUZ

import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component'; // Layout Component
// Child Componentler
import { UserInfoComponent } from './user-info/user-info.component';
import { AddressListComponent } from './address-list/address-list.component';
import { OrderListComponent } from './order-list/order-list.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { SavedCardsComponent } from './saved-cards/saved-cards.component';

// Profil bölümünün rotaları
export const PROFILE_ROUTES: Routes = [
  {
    path: '', // Ana /profile yolu
    component: ProfileComponent, // Ana layout component'ini yükle
    children: [ // Bu component'in içindeki router-outlet'e yüklenecekler:
      { path: 'orders', component: OrderListComponent },      // /profile/orders
      { path: 'reviews', component: ReviewsComponent },    // /profile/reviews
      { path: 'user-info', component: UserInfoComponent }, // /profile/user-info
      { path: 'addresses', component: AddressListComponent },// /profile/addresses
      { path: 'cards', component: SavedCardsComponent },   // /profile/cards
      // /profile adresine direkt gidilirse user-info'ya yönlendir
      { path: '', redirectTo: 'user-info', pathMatch: 'full' }
    ]
  }
];
