import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Product, ProductService } from '../../core/services/product.service'; // Yolu Kontrol Et!
import { CartService } from '../../core/services/cart.service'; // Yolu Kontrol Et!
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { CartItemRequest } from '../../core/models/cart-item-request.model'; // Import CartItemRequest


@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
      CommonModule,
      RouterLink
      , MatSnackBarModule, MatButtonModule
  ],
  templateUrl: './search.component.html',
  styles: [`

    .search-results-container {
      max-width: 1200px; /* Anasayfa/Liste ile aynı genişlik */
      margin: 30px auto; /* Üst/alt ve yanlardan ortala */
      padding: 0 15px;   /* Yanlardan iç boşluk */
    }
    .search-title {
      font-size: 1.8rem; /* Başlık boyutu */
      font-weight: 500; /* Material orta kalınlık */
      margin-bottom: 24px;
      border-bottom: 1px solid rgba(0,0,0,0.12); /* Material divider rengi */
      padding-bottom: 16px;
    }
    .search-term {
      font-style: italic;
      font-weight: 600; /* Aranan terimi vurgula */
    }
    .no-results {
      text-align: center;
      padding: 50px 20px; /* Daha fazla boşluk */
      color: rgba(0,0,0,0.54); /* Material ikincil yazı rengi */
      font-size: 1.1rem;
      border: 1px dashed #ccc; /* Farklı göstermek için kesikli çizgi */
      border-radius: 8px;
      margin-top: 20px;
    }

    /* === ÜRÜN GRID STİLLERİ (Homepage/ProductList'ten Kopyalandı - Geçici) === */
    /* TODO: Bu stilleri Material Card ile değiştirmek veya paylaşılan stile taşımak */
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 30px; }
    .product-card { border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; overflow: hidden; text-align: left; background-color: #fff; transition: box-shadow 0.3s ease; display: flex; flex-direction: column; }
    .product-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .product-link { text-decoration: none; color: inherit; display: flex; flex-direction: column; flex-grow: 1;}
    .product-image { width: 100%; height: 200px; object-fit: cover; display: block; background-color: #f5f5f5; }
    .product-info { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; }
    .product-name { font-size: 1rem; font-weight: 500; color: rgba(0,0,0,0.87); margin: 0 0 8px 0; line-height: 1.4; height: 2.8em; overflow: hidden; } /* Yaklaşık 2 satır */
    .product-price { font-size: 1.1rem; font-weight: bold; color: #3f51b5; margin: auto 0 16px 0; }
    .add-to-cart-btn { margin: 0 16px 16px 16px; padding: 8px 16px; background-color: #ff6f00; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; text-align: center; transition: background-color 0.2s ease; margin-top: auto; }
    .add-to-cart-btn:hover { background-color: #e66000; }
    /* === ÜRÜN GRID STİLLERİ SONU === */
  `]
})
export class SearchComponent implements OnInit {
  products$: Observable<Product[]> = of([]);
  searchTerm: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('SearchComponent ngOnInit');
    this.products$ = this.route.queryParamMap.pipe(
      switchMap(params => {
        this.searchTerm = params.get('q');
        console.log('SearchComponent: searchTerm from query params:', this.searchTerm);
        if (this.searchTerm && this.searchTerm.trim() !== '') {
          return this.productService.searchProducts(this.searchTerm);
        } else {
          this.searchTerm = null; // Terim yoksa null yapalım
          return of([]);
        }
      }),
      tap(products => console.log(`SearchComponent: Received ${products.length} products for term "${this.searchTerm}"`))
    );
  }

  addToCart(product: Product | undefined | null): void {
    if (product) {
      if (product.stockQuantity !== undefined && product.stockQuantity < 1) {
        this.snackBar.open(`'${product.name}' stokta bulunmamaktadır!`, 'Kapat', {
          duration: 3000, panelClass: ['warning-snackbar']
        });
        return;
      }
      console.log(`${this.constructor.name}: Adding product to cart:`, product.name);
      
      const itemRequest: CartItemRequest = { 
        productId: product.id,
        quantity: 1 // Default quantity
      };

      // Call the updated CartService method
      this.cartService.addItem(itemRequest, product).subscribe({
        next: (cart) => {
          this.snackBar.open(`'${product.name}' sepete eklendi`, 'Tamam', {
            duration: 2500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (err) => {
          console.error(`${this.constructor.name}: Error adding product to cart -`, err);
          let errorMessage = "Ürün sepete eklenemedi!";
          if (err && err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err && err.message) {
            errorMessage = err.message;
          }
          this.snackBar.open(errorMessage, 'Kapat', {
            duration: 3500,
            panelClass: ['error-snackbar']
          });
        }
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
