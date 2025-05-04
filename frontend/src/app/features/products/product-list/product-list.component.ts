import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolu Kontrol Et!
import { CartService } from '../../../core/services/cart.service'; // Yolu Kontrol Et!

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink], // RouterLink ürün detayına gitmek için gerekli
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products$: Observable<Product[]> = of([]);
  categoryTitle: string = 'Tüm Ürünler';

  constructor(
    private route: ActivatedRoute, // URL parametrelerini okumak için
    private productService: ProductService, // Ürünleri çekmek için
    private cartService: CartService, // Sepete eklemek için
    private router: Router // Sepete ekledikten sonra yönlendirme için
  ) { }

  ngOnInit(): void {
    console.log('ProductListComponent ngOnInit');
    // Route parametrelerini (paramMap) reaktif olarak dinle
    this.products$ = this.route.paramMap.pipe(
      switchMap(params => {
        const categorySlug = params.get('categorySlug'); // Rota tanımındaki :categorySlug
        console.log('ProductListComponent: categorySlug from route:', categorySlug);
        if (categorySlug) {
          this.categoryTitle = this.formatCategoryTitle(categorySlug);
          return this.productService.getProductsByCategory(categorySlug);
        } else {
          this.categoryTitle = 'Tüm Ürünler';
          return this.productService.getProducts();
        }
      })
    );
  }

  // URL slug'ını okunabilir başlığa çevirir (basit versiyon)
  formatCategoryTitle(slug: string): string {
    if (!slug) return 'Tüm Ürünler';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Tireleri boşluk yap, baş harfleri büyüt
  }

  // Sepete Ekle mantığı (Homepage'den kopyalandı)
  addToCart(product: Product): void {
    console.log('ProductList: Adding to cart:', product.name);
    this.cartService.addToCart(product);
    this.router.navigate(['/cart']);
  }
}
