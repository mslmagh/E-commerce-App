// frontend/src/app/features/products/product-detail/product-detail.component.ts
// SON HAL (Sekme Değiştirme + Favori Butonu Mantığı Dahil - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolu Kontrol Et!
import { CartService } from '../../../core/services/cart.service'; // Yolu Kontrol Et!
import { AuthService } from '../../../core/services/auth.service'; // AuthService Eklendi (YOLU KONTROL ET!)

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product$: Observable<Product | undefined> = of(undefined);
  public activeTab: string = 'description';
  public isFavorite: boolean = false; // Favori durumu için değişken

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private authService: AuthService // AuthService enjekte edildi
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    console.log('ProductDetailComponent: Found productId from route:', productId);
    if (productId) {
      this.product$ = this.productService.getProductById(productId);
      // TODO: Sayfa yüklenince ürünün favori olup olmadığını kontrol et ve isFavorite'i ayarla
    } else {
      console.error('Product ID not found in route parameters!');
    }
  }

  addToCart(product: Product | undefined | null): void {
    if (product) {
       console.log('ProductDetail: Adding to cart:', product.name);
       this.cartService.addToCart(product);
       this.router.navigate(['/cart']);
    } else {
       console.error("ProductDetail: Cannot add null/undefined product to cart.");
       alert("Ürün bilgisi bulunamadığı için sepete eklenemedi.");
    }
  }

  selectTab(tabName: string): void {
    this.activeTab = tabName;
    console.log('Selected tab:', this.activeTab);
  }

  // Favori butonu için metod
  toggleFavorite(product: Product | undefined | null): void {
    if (!product) return;

    if (this.authService.isLoggedIn()) {
      this.isFavorite = !this.isFavorite;
      console.log(`Product ${product.id} favorite status toggled to: ${this.isFavorite}`);
      // TODO: Gerçek FavoritesService çağrısı (add/remove)
      if(this.isFavorite){
        alert(`${product.name} favorilere eklendi! (Simülasyon)`);
      } else {
        alert(`${product.name} favorilerden çıkarıldı! (Simülasyon)`);
      }
    } else {
      console.log('User not logged in. Redirecting to login to add favorite.');
      alert('Ürünü favorilerinize eklemek için lütfen giriş yapın.');
      this.router.navigate(['/auth/login']);
    }
  }
}
