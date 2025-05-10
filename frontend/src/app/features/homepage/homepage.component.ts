import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Product, ProductService } from '../../core/services/product.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CartItemRequest } from '../../core/models/cart-item-request.model';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ProductCardComponent, MatSnackBarModule, MatButtonModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule, MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  allProducts: Product[] = [];
  sortedAndFilteredProducts: Product[] = [];

  selectedSortOption: string = 'default';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  isLoading: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    console.log('HomepageComponent ngOnInit');
    this.loadProductsFromApi();
  }

  loadProductsFromApi(): void {
    this.isLoading = true;
    this.productService.getProducts().pipe(
      tap(products => {
        this.allProducts = products;
        if (!products || products.length === 0) {
            console.warn("API'den ürün gelmedi.");
            this.snackBar.open('Gösterilecek ürün bulunamadı.', 'Kapat', { duration: 3000 });
        }
        this.updateDisplayedProducts();
        this.isLoading = false;
      }),
      catchError(error => {
        console.error("Ürünler yüklenirken hata oluştu.", error);
        this.allProducts = []; // Hata durumunda boş dizi
        this.updateDisplayedProducts();
        this.isLoading = false;
        this.snackBar.open('Ürünler yüklenirken bir sorun oluştu.', 'Kapat', { duration: 3000 });
        return of([]);
      })
    ).subscribe();
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

  updateDisplayedProducts(): void {
    let filteredProducts = [...this.allProducts];

    if (this.minPrice !== null && !isNaN(this.minPrice)) {
      filteredProducts = filteredProducts.filter(product => product.price >= this.minPrice!);
    }
    if (this.maxPrice !== null && !isNaN(this.maxPrice) && this.maxPrice > 0) {
      filteredProducts = filteredProducts.filter(product => product.price <= this.maxPrice!);
    }

    let productsToSort = [...filteredProducts];

    switch (this.selectedSortOption) {
      case 'price-asc':
        productsToSort.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        productsToSort.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        productsToSort.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'rating-asc':
        productsToSort.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
        break;
      case 'default':
      default:
        productsToSort.sort((a, b) => a.id - b.id); // Örnek: ID'ye göre sırala
        break;
    }
    this.sortedAndFilteredProducts = productsToSort;
    console.log('Ürünler güncellendi. Gösterilen ürün sayısı:', this.sortedAndFilteredProducts.length);
  }

   onPriceRangeChange(): void {
       this.minPrice = this.minPrice !== null && !isNaN(Number(this.minPrice)) ? Number(this.minPrice) : null;
       this.maxPrice = this.maxPrice !== null && !isNaN(Number(this.maxPrice)) ? Number(this.maxPrice) : null;
       if (this.minPrice !== null && this.maxPrice !== null && this.minPrice > this.maxPrice) {
        this.snackBar.open('Min fiyat, max fiyattan büyük olamaz.', 'Kapat', { duration: 3000 });
       }
        this.updateDisplayedProducts();
   }

   onSortOptionChange(): void {
      this.updateDisplayedProducts();
   }
}
