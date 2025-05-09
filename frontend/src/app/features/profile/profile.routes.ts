import { Routes } from '@angular/router';
import { ProfileComponent } from './profile.component'; // Layout Component
import { UserInfoComponent } from './user-info/user-info.component';
import { AddressListComponent } from './address-list/address-list.component';
import { OrderListComponent } from './order-list/order-list.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { SavedCardsComponent } from './saved-cards/saved-cards.component';
import { AddressFormComponent } from './address-form/address-form.component';

export const PROFILE_ROUTES: Routes = [
  {
    path: '', // Ana /profile yolu
    component: ProfileComponent, // Ana layout component'ini yükle
    children: [
      { path: 'orders', component: OrderListComponent },      // /profile/orders
      { path: 'reviews', component: ReviewsComponent },    // /profile/reviews
      { path: 'user-info', component: UserInfoComponent }, // /profile/user-info
      { path: 'addresses', component: AddressListComponent },// /profile/addresses
      { path: 'cards', component: SavedCardsComponent },   // /profile/cards
      { path: 'address-form', component: AddressFormComponent }, // New route for adding an address
      { path: 'address-form/:id', component: AddressFormComponent }, // New route for editing an address
      { path: '', redirectTo: 'user-info', pathMatch: 'full' }
    ]
  }
];
