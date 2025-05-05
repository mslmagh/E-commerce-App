import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
// ProductCardComponent'i import et (YOLU KONTROL ET!)
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
// Product interface'ini import et (YOLU KONTROL ET!)
import { Product } from '../../core/services/product.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  // CommonModule, RouterLink ve ProductCardComponent'i import et
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'] // CSS dosyasını kullanıyoruz
})
export class HomepageComponent implements OnInit {

  // Mock ürün verisi (Product tipinde)
  // !!! imageUrl'leri kendi assets klasöründeki resimlerle değiştirmen önerilir !!!
  featuredProducts: Product[] = [
    { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, imageUrl: 'assets/images/kulaklik.jpg', description: 'Aktif gürültü engelleme özellikli...', categorySlug: 'elektronik' },
    { id: 2, name: 'Akıllı Saat Fit+', price: 1450, imageUrl: 'assets/images/saat.png', description: 'Adım sayar, nabız ölçer...', categorySlug: 'elektronik' },
    { id: 3, name: 'Mekanik Klavye RGB', price: 650, imageUrl: 'assets/images/klavye.jpg', description: 'Oyuncular ve yazarlar için...', categorySlug: 'elektronik' },
    { id: 4, name: 'Yoga Matı Kaymaz', price: 250, imageUrl: 'assets/images/mat.jpg', description: 'TPE malzemeden üretilmiş...', categorySlug: 'spor-outdoor' },
    { id: 5, name: 'Blender Seti PowerMix', price: 1100, imageUrl: 'assets/images/blender.jpg', description: 'Çok fonksiyonlu, güçlü motorlu...', categorySlug: 'ev-yasam' },
    { id: 6, name: 'Erkek Sneaker Air', price: 1999, imageUrl: 'assets/images/sneaker.jpg', description: 'Hafif ve rahat, günlük kullanıma uygun...', categorySlug: 'erkek-giyim' }
  ];

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Başlangıçta bir şey yapmaya gerek yok
  }

  // ProductCardComponent'ten gelen (addToCartClick) olayını yakalar
  addToCart(product: Product): void { // Parametre tipi Product
    console.log('Homepage: addToCart event received for:', product.name);
    this.cartService.addToCart(product);
    this.router.navigate(['/cart']);
  }
}
