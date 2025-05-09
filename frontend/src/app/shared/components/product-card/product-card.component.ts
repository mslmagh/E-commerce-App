// frontend/src/app/shared/components/product-card/product-card.component.ts
// SON HAL (Yorumsuz, Inline Styles ile)

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/services/product.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ CommonModule, RouterLink, MatCardModule, MatButtonModule /*, MatIconModule*/ ],
  templateUrl: './product-card.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    mat-card { height: 100%; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: box-shadow 0.3s ease; }
    mat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .product-card-link { text-decoration: none; color: inherit; display: flex; flex-direction: column; flex-grow: 1; }
    img[mat-card-image] { height: 200px; object-fit: cover; background-color: #f5f5f5; }
     mat-card-content { padding: 16px 16px 8px 16px; flex-grow: 1; }
     mat-card-title { font-size: 1rem; line-height: 1.3; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 2.6em; }
     mat-card-subtitle { font-size: 1.1rem; font-weight: bold; color: #3f51b5; margin-top: auto; padding-top: 8px; }
     mat-card-actions { padding: 8px 16px 16px 16px !important; margin-top: auto; }
     button[mat-flat-button] { width: 100%; background-color: #ff6f00; color: white; }
     button[mat-flat-button]:hover { background-color: #e66000; }
  `]
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCartClick = new EventEmitter<Product>();
  constructor() { }
  addToCart(): void {
    console.log('ProductCard: Emitting addToCartClick for:', this.product?.name);
    this.addToCartClick.emit(this.product);
  }
}
