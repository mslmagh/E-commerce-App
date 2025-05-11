import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Cart } from '../../../core/models/cart.model';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  searchTerm: string = '';
  isLoggedIn$: Observable<boolean>;
  isSeller$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  cartItemCount$: Observable<number>;
  private cartSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.isSeller$ = this.authService.userRole$.pipe(
      map(role => role === 'ROLE_SELLER')
    );
    this.isAdmin$ = this.authService.userRole$.pipe(
      map(role => role === 'ROLE_ADMIN')
    );
    this.cartItemCount$ = this.cartService.cart$.pipe(
      map((cart: Cart | null) => {
        if (!cart || !cart.items) {
          return 0;
        }
        return cart.items.reduce((count, item) => count + item.quantity, 0);
      })
    );
  }

  ngOnInit(): void {
    console.log('HeaderComponent ngOnInit');
  }

  ngOnDestroy(): void {
     if (this.cartSubscription) { this.cartSubscription.unsubscribe(); } // Bu da kaldırılabilir eğer tap yoksa
  }

  performSearch(): void {
    console.log('Header: performSearch triggered with term:', this.searchTerm);


    if (this.searchTerm && this.searchTerm.trim().length > 0) {

      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm.trim() }
      });

    } else {
      console.log('Header: Empty search term, not navigating.');
    }
  }

  logout(): void {
    console.log('HeaderComponent: Logging out...');
    this.authService.logout(); // Servisteki metodu çağır (token'ı siler ve status'u günceller)
    this.router.navigate(['/auth/login']); // Login sayfasına yönlendir
  }
}
