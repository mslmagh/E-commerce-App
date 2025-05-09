import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component'; // Eklendi
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Eklendi

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatSnackBarModule,
    MatButtonModule,
    ProductCardComponent, // Eklendi
    MatProgressSpinnerModule // Eklendi
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products$: Observable<Product[]> = of([]);
  categoryTitle: string = 'Tüm Ürünler';
  isLoading: boolean = false; // Eklendi

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('ProductListComponent ngOnInit');
    this.isLoading = true; // Yükleme başlangıcı
    this.products$ = this.route.paramMap.pipe(
      switchMap(params => {
        const categorySlug = params.get('categorySlug');
        console.log('ProductListComponent: categorySlug from route:', categorySlug);
        if (categorySlug) {
          this.categoryTitle = this.formatCategoryTitle(categorySlug);
          return this.productService.getProductsByCategorySlug(categorySlug).pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
              console.error(err);
              return of([]);
            })
          );
        } else {
          this.categoryTitle = 'Tüm Ürünler';
          return this.productService.getProducts().pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
              console.error(err);
              return of([]);
            })
          );
        }
      })
    );
  }

  formatCategoryTitle(slug: string): string {
    if (!slug) return 'Tüm Ürünler';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      this.cartService.addToCart(product); // CartService güncellenmeli
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
