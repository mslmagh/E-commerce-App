// frontend/src/app/features/favorites/favorites.component.ts
// SON HAL (Sepete Ekleme Fonksiyonu Eklendi - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FavoritesService } from '../../core/services/favorites.service'; // Yolu Kontrol Et!
import { Product } from '../../core/services/product.service';       // Yolu Kontrol Et!
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component'; // Yolu Kontrol Et!
import { Router, RouterLink } from '@angular/router'; // Router eklendi
import { CartService } from '../../core/services/cart.service'; // CartService eklendi (YOLU KONTROL ET!)
import { MatButtonModule } from '@angular/material/button'; // Material Buton Modülü
import { MatIconModule } from '@angular/material/icon';   // Material İkon Modülü

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent, // Ürün kartı
    MatButtonModule,      // Kaldır butonu ve Sepete Ekle butonu (kartın içindeki) için
    MatIconModule       // Butonlardaki ikonlar için
  ],
  templateUrl: './favorites.component.html',
  // styleUrls: ['./favorites.component.css'] // Kaldırıp inline eklemiştik
  styles: [`
    /* :host { display: block; } */
    .favorites-page-container { max-width: 1200px; margin: 30px auto; padding: 0 15px; }
    .favorites-title { font-size: 1.8rem; font-weight: 500; margin-bottom: 24px; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 16px; }
    .empty-favorites-message { text-align: center; padding: 50px 20px; color: #6c757d; font-size: 1.1rem; border: 1px dashed #ccc; border-radius: 8px; background-color: #f8f9fa; margin-top: 20px; }
    .empty-favorites-message p { margin-bottom: 25px; }
    .btn { display: inline-block; font-weight: 400; text-align: center; vertical-align: middle; cursor: pointer; border: 1px solid transparent; padding: 0.375rem 0.75rem; font-size: 1rem; line-height: 1.5; border-radius: 0.25rem; text-decoration:none; transition: all .15s ease-in-out; }
    .btn-primary { color: #fff; background-color: #007bff; border-color: #007bff; }
    .btn-primary:hover { background-color: #0056b3; border-color: #0056b3; }
    .favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 20px; }
    .favorite-item-container { display: flex; flex-direction: column; height: 100%; }
    .btn-remove-fav { margin-top: 8px; width: 100%; }
  `]
})
export class FavoritesComponent implements OnInit {

  favorites$: Observable<Product[]>;

  // CartService ve Router constructor'a eklendi
  constructor(
    private favoritesService: FavoritesService,
    private cartService: CartService,
    private router: Router
  ) {
    this.favorites$ = this.favoritesService.favorites$;
  }

  ngOnInit(): void {
    console.log('FavoritesComponent loaded');
  }

  // Favorilerden çıkarma metodu (mevcuttu)
  removeFromFavorites(product: Product): void {
    if (product) {
      console.log('FavoritesPage: Removing product from favorites:', product.name);
      this.favoritesService.removeFavorite(product.id);
    }
  }

  // YENİ EKLENEN METOD (ProductCard'dan gelen eventi yakalar)
  addToCart(product: Product): void {
    if(product) {
      console.log('FavoritesPage: addToCart event received for:', product.name);
      // CartService'i çağır
      this.cartService.addToCart(product);
      // Sepet sayfasına yönlendir
      this.router.navigate(['/cart']);
    }
  }
}
