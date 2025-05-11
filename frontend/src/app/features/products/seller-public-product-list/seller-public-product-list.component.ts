import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService, Product } from '../../../core/services/product.service';
import { Observable, EMPTY } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card'; // For product cards
// Assuming ProductCardComponent exists and is suitable
// import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-seller-public-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatCardModule,
    // ProductCardComponent // If using
  ],
  templateUrl: './seller-public-product-list.component.html',
  styles: [`
    .product-list-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .loading-container, .empty-message { text-align: center; padding: 40px; }
    .seller-header { margin-bottom: 24px; padding-bottom:16px; border-bottom: 1px solid #eee; }
    .seller-header h2 { font-size: 1.8em; font-weight: 500; }
    .seller-header a { font-size: 0.9em; }
    /* Basic Product Card Style (if not using a shared component) */
    .product-card { border: 1px solid #eee; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: block; }
    .product-card img { width: 100%; height: 200px; object-fit: cover; }
    .product-card-content { padding: 15px; }
    .product-card-name { font-size: 1.1em; font-weight: 500; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
    .product-card-price { font-size: 1.2em; font-weight: bold; color: #d32f2f; margin-bottom: 10px;}
    .product-card-category { font-size: 0.85em; color: #757575; margin-bottom: 5px; }
  `]
})
export class SellerPublicProductListComponent implements OnInit {
  products$: Observable<Product[]> | undefined;
  isLoading = true;
  sellerUsername: string | null = null;

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.products$ = this.route.paramMap.pipe(
      tap(() => this.isLoading = true),
      switchMap(params => {
        this.sellerUsername = params.get('username');
        if (this.sellerUsername) {
          return this.productService.getProductsBySellerUsername(this.sellerUsername).pipe(
            tap(() => this.isLoading = false),
            catchError((err: any) => {
              this.isLoading = false;
              this.snackBar.open('Error loading products for seller ' + this.sellerUsername + ': ' + (err.message || 'Unknown error'), 'Close', { duration: 5000 });
              console.error(err);
              return EMPTY;
            })
          );
        } else {
          this.isLoading = false;
          this.snackBar.open('Seller username not found in route.', 'Close', { duration: 3000 });
          return EMPTY;
        }
      })
    );
  }
} 