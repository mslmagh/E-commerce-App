// frontend/src/app/features/homepage/homepage.component.ts
// SON HAL (CartService ve Router Kullanımı Eklendi)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Router'ı Angular'ın router kütüphanesinden import ediyoruz
import { Router, RouterLink } from '@angular/router';
// CartService'i kendi oluşturduğumuz yerden import ediyoruz (YOLU KONTROL ET!)
import { CartService } from '../../core/services/cart.service';


@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule,RouterLink], // Template'de *ngFor kullandığımız için CommonModule kalmalı
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  // Mock ürün verisi (varsayılan)
  featuredProducts: any[] = [
    { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Kulaklık' },
    { id: 2, name: 'Akıllı Saat Fit+', price: 1450, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Akıllı+Saat' },
    { id: 3, name: 'Mekanik Klavye RGB', price: 650, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Klavye' },
    { id: 4, name: 'Yoga Matı Kaymaz', price: 250, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Yoga+Matı' },
    { id: 5, name: 'Blender Seti PowerMix', price: 1100, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Blender' },
    { id: 6, name: 'Erkek Sneaker Air', price: 1999, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Sneaker' }
  ];

  // CartService ve Router'ı constructor aracılığıyla enjekte ediyoruz
  constructor(
    private cartService: CartService,
    private router: Router // Angular Router servisi
  ) { }

  ngOnInit(): void {
    // Component ilk yüklendiğinde yapılacak bir şey varsa buraya yazılır
  }

  /**
   * "Sepete Ekle" butonuna tıklandığında çalışacak metod.
   * @param product Tıklanan ürünün bilgisi (HTML'den *ngFor ile gelir)
   */
  addToCart(product: any): void {
    console.log('Homepage: addToCart called for:', product.name); // Butona basıldığını loglayalım

    // 1. Adım: Ürünü CartService aracılığıyla sepete ekle
    this.cartService.addToCart(product);

    // 2. Adım: Kullanıcıyı sepet sayfasına yönlendir
    // Router servisinin navigate metodunu kullanıyoruz
    this.router.navigate(['/cart']); // '/cart' bizim app.routes.ts'de tanımladığımız adres
  }
}
