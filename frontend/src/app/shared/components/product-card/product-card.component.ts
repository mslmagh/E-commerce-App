import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductComparisonService } from '../../../core/services/product-comparison.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css']
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;

  isInCompareList: boolean = false;
  private comparisonSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private productComparisonService: ProductComparisonService
  ) {}

  ngOnInit(): void {
    if (this.product && this.product.id !== undefined) {
      this.isInCompareList = this.productComparisonService.getComparisonList().some(p => p.id === this.product.id);
      this.comparisonSubscription = this.productComparisonService.comparisonList$.subscribe(list => {
        this.isInCompareList = list.some(p => p.id === this.product.id);
      });
    } else {
      console.error('ProductCardComponent: Product or Product ID is undefined.', this.product);
    }
  }

  ngOnDestroy(): void {
    if (this.comparisonSubscription) {
      this.comparisonSubscription.unsubscribe();
    }
  }

  addToCart(): void {
    if (!this.product) {
      this.snackBar.open('Ürün bilgisi bulunamadı.', 'Kapat', { duration: 3000 });
      return;
    }
    
    if (this.product.stockQuantity !== undefined && this.product.stockQuantity < 1) {
      this.snackBar.open(`'${this.product.name}' stokta bulunmamaktadır!`, 'Kapat', { 
        duration: 3000, 
        panelClass: ['warning-snackbar'] 
      });
      return;
    }

    console.log(`${this.constructor.name}: Adding product to cart:`, this.product.name);
    const itemRequest = { productId: Number(this.product.id), quantity: 1 };
    
    this.cartService.addItem(itemRequest, this.product).subscribe({
      next: (cart) => {
        this.snackBar.open(`'${this.product.name}' sepete eklendi!`, 'Tamam', { 
          duration: 2000,
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
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleCompare(): void {
    if (!this.product || this.product.id === undefined) {
      this.snackBar.open('Karşılaştırma için ürün bilgisi bulunamadı.', 'Kapat', { duration: 3000 });
      return;
    }
    if (this.isInCompareList) {
      this.productComparisonService.removeFromCompare(this.product.id);
    } else {
      this.productComparisonService.addToCompare(this.product.id);
    }
  }
}
