import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolu Kontrol Et!
import { CartService } from '../../../core/services/cart.service'; // Yolu Kontrol Et!
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatSnackBarModule, MatButtonModule], // RouterLink ürün detayına gitmek için gerekli
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
    private router: Router ,// Sepete ekledikten sonra yönlendirme için
    private snackBar: MatSnackBar
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
  addToCart(product: Product | undefined | null): void { // ProductDetail'deki null kontrolü için tip güncellendi
    if (product) {
      console.log(`${this.constructor.name}: Adding product to cart:`, product.name); // Hangi component'ten çağrıldığını logla
      this.cartService.addToCart(product);


      this.snackBar.open(`'${product.name}' sepete eklendi`, 'Tamam', {
        duration: 2500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } else {
      console.error(`${this.constructor.name}: Cannot add null/undefined product to cart.`);

      this.snackBar.open("Ürün sepete eklenemedi!", 'Kapat', {
         duration: 3000,
         panelClass: ['error-snackbar']
        });
    }
  }
}
