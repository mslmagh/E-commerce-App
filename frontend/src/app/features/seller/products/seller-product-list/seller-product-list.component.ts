import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngFor, async pipe vb. için
import { Router, RouterLink } from '@angular/router'; // Yönlendirme ve linkler için
import { MatTableModule } from '@angular/material/table'; // Tablo için
import { MatButtonModule } from '@angular/material/button'; // Butonlar için
import { MatIconModule } from '@angular/material/icon';     // İkonlar için
import { MatTooltipModule } from '@angular/material/tooltip'; // Tooltip için
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Yükleme göstergesi
import { MatCardModule } from '@angular/material/card'; // Kart görünümü için (opsiyonel)
import { MatDividerModule } from '@angular/material/divider'; // Ayırıcı için (opsiyonel)
import { MatSnackBar } from '@angular/material/snack-bar'; // Snackbar için

import { Product, ProductService } from '../../../../core/services/product.service'; // Product ve ProductService import edildi
import { catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-seller-product-list', // Component'in HTML etiketi
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, // HTML'de routerLink kullanacaksak
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule, // Eğer "ürün yok" mesajını kart içinde göstereceksek
    MatDividerModule
  ],
  templateUrl: './seller-product-list.component.html',
  styles: [`
    .product-list-container {
      /* padding: 20px; // SellerLayoutComponent'ten geliyor olabilir */
    }
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .list-header h2 {
      margin: 0;
      font-size: 1.8em;
      font-weight: 500;
    }
    table.mat-mdc-table { /* Angular Material v15+ için */
      width: 100%;
      box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
      border-radius: 4px;
      overflow: hidden; /* Köşelerin düzgün görünmesi için */
    }
    .mat-column-imageUrl { /* Görsel kolonu için genişlik */
      width: 80px;
      padding-right: 16px !important; /* Görselle yazı arası boşluk */
    }
    .product-thumbnail {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
      vertical-align: middle;
    }
    .mat-column-actions { /* İşlemler kolonu için genişlik ve hizalama */
      width: 130px; /* İki ikon butonu sığacak kadar */
    }
    .actions-cell {
        text-align: right; /* Butonları sağa yasla */
    }
    .actions-cell button:not(:last-child) {
        margin-right: 8px; /* Butonlar arası boşluk */
    }
    .no-products-message {
      text-align: center;
      padding: 40px;
      color: rgba(0,0,0,0.54); /* Material ikincil yazı rengi */
      border: 1px dashed #ccc;
      border-radius: 4px;
      background-color: #f9f9f9;
      margin-top: 20px;
    }
    .no-products-message mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
    }
    .no-products-message p {
      margin-bottom: 20px;
      font-size: 1.1em;
    }
    .loading-spinner-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      min-height: 200px;
    }
    /* Durum etiketleri için stiller */
    .status-chip {
      padding: 3px 10px;
      border-radius: 16px;
      font-size: 0.75em;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
      line-height: 1.5;
      border: 1px solid transparent;
    }
    .status-yayinda { background-color: #C8E6C9; color: #2E7D32; border-color: #A5D6A7; }
    .status-stok-tukendi { background-color: #F5F5F5; color: #757575; border-color: #E0E0E0; }
  `]
})
export class SellerProductListComponent implements OnInit {
  displayedColumns: string[] = ['imageUrl', 'name', 'categoryName', 'price', 'stockQuantity', 'derivedStatus', 'actions'];
  dataSource: Product[] = [];
  isLoading = false;

  private productService = inject(ProductService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {}

  ngOnInit(): void {
    this.loadSellerProducts();
  }

  loadSellerProducts(): void {
    this.isLoading = true;
    this.productService.getMyProducts().pipe(
      tap(products => {
        this.dataSource = products;
        this.isLoading = false;
        if (!products || products.length === 0) {
          this.snackBar.open('Henüz hiç ürün eklememişsiniz.', 'Tamam', { duration: 3000 });
        }
      }),
      catchError(error => {
        this.isLoading = false;
        console.error('Error loading seller products:', error);
        this.snackBar.open(`Ürünler yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`, 'Kapat', {
          duration: 5000,
          panelClass: ['error-snackbar'] // Opsiyonel: Hata snackbar'ı için özel stil
        });
        return EMPTY; // veya throwError(() => error) eğer hatayı global handler'a bırakmak isterseniz
      })
    ).subscribe();
  }

  navigateToAddNewProduct(): void {
    this.router.navigate(['/seller/products/new']);
  }

  editProduct(product: Product): void {
    console.log('Düzenlenecek ürün:', product);
    this.router.navigate(['/seller/products/edit', product.id]);
  }

  deleteProduct(product: Product): void {
    console.log('Silinecek ürün:', product);
    if (confirm(`'${product.name}' adlı ürünü silmek istediğinizden emin misiniz?`)) {
      this.isLoading = true;
      this.productService.deleteProduct(product.id).pipe(
        tap(() => {
          this.isLoading = false;
          this.dataSource = this.dataSource.filter(p => p.id !== product.id);
          this.snackBar.open(`'${product.name}' başarıyla silindi.`, 'Tamam', { duration: 3000 });
          // Eğer silme sonrası hiç ürün kalmazsa özel bir mesaj gösterilebilir.
          if (this.dataSource.length === 0) {
             this.snackBar.open('Tüm ürünleriniz silindi.', 'Tamam', { duration: 3000 });
          }
        }),
        catchError(error => {
          this.isLoading = false;
          console.error('Error deleting product:', error);
          this.snackBar.open(`Ürün silinirken bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`, 'Kapat', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          return EMPTY;
        })
      ).subscribe();
    }
  }

  getDerivedStatus(product: Product): 'Yayında' | 'Stok Tükendi' {
    return product.stockQuantity > 0 ? 'Yayında' : 'Stok Tükendi';
  }

  getStatusClass(product: Product): string {
    const status = this.getDerivedStatus(product);
    switch (status) {
      case 'Yayında': return 'status-yayinda';
      case 'Stok Tükendi': return 'status-stok-tukendi';
      default: return '';
    }
  }
}
