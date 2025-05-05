import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, map } from 'rxjs'; // Observable eklendi
import { AuthService } from '../../../core/services/auth.service';
import { CartService, CartItem } from '../../../core/services/cart.service';

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
  // isUserLoggedIn değişkeni yerine Observable kullanacağız
  isLoggedIn$: Observable<boolean>;
  cartItemCount$: Observable<number>;
  // Sadece cartSubscription kaldı (isLoggedIn$ async pipe ile kullanılacak)
  private cartSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    // Login durumunu servisteki Observable'dan al
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    // Sepet sayısını servisteki Observable'dan al ve map ile işle
    this.cartItemCount$ = this.cartService.cartItems$.pipe(
      map((items: CartItem[]) => items.reduce((count, item) => count + item.quantity, 0)),
      // tap(count => console.log('Header: cartItemCount$ emitted:', count))
    );
  }

  ngOnInit(): void {
    // Artık ngOnInit içinde login durumu kontrolüne gerek yok, Observable takip ediyor.
    console.log('HeaderComponent ngOnInit');
  }

  ngOnDestroy(): void {
    // cartSubscription artık yok (eğer cartItemCount$ için tap logunu kaldırdıysak)
    // Eğer cartSubscription varsa iptal edilmeli.
    // Eğer isLoggedIn$ için manuel subscribe yapsaydık onu da iptal ederdik.
    // Async pipe kullandığımız için gerek yok.
     if (this.cartSubscription) { this.cartSubscription.unsubscribe(); } // Bu da kaldırılabilir eğer tap yoksa
  }

  performSearch(): void {
    console.log('Header: performSearch triggered with term:', this.searchTerm);


    if (this.searchTerm && this.searchTerm.trim().length > 0) {

      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm.trim() }
      });

      // this.searchTerm = '';
    } else {
      // Arama terimi boşsa bir şey yapma veya kullanıcıyı uyarabilirsin
      console.log('Header: Empty search term, not navigating.');
    }
  }

  logout(): void {
    console.log('HeaderComponent: Logging out...');
    this.authService.logout(); // Servisteki metodu çağır (token'ı siler ve status'u günceller)
    // Yönlendirmeyi de logout metodu yapabilir veya burada kalabilir
    this.router.navigate(['/auth/login']); // Login sayfasına yönlendir
    // this.isUserLoggedIn = false; // Artık buna gerek yok, Observable güncellenecek
  }
}
