import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component'; // Yolu kontrol et
import { FooterComponent } from './core/layout/footer/footer.component'; // Yolu kontrol et
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { FavoritesService } from './core/services/favorites.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root', // index.html'deki <app-root> etiketi
  standalone: true,    // Standalone component
  imports: [
      RouterOutlet,     // <router-outlet> için gerekli
      HeaderComponent,  // <app-header> için gerekli
      FooterComponent   // <app-footer> için gerekli
  ],
  templateUrl: './app.component.html', // Bu component'in HTML'i
  styleUrls: ['./app.component.css']    // Bu component'in CSS'i (Sticky footer için düzenlemiştik)
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend'; // Veya projenin package.json'daki adı
  private authSub: Subscription | null = null;
  
  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private favoritesService: FavoritesService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to auth state changes to sync cart and favorites
    this.authSub = this.authService.authStateChanged$.subscribe(state => {
      if (state.event === 'login') {
        // User logged in - sync local data to API
        console.log('AppComponent: User logged in, syncing local data to API');
        this.cartService.syncLocalCartWithApi();
        this.favoritesService.syncFavoritesWithApi();
      } else if (state.event === 'logout') {
        // User logged out - no action needed as local data will be loaded
        console.log('AppComponent: User logged out');
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }
}
