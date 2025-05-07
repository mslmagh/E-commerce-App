// src/app/features/seller/products/seller-product-list/seller-product-list.component.ts

import { Component, OnInit } from '@angular/core';
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

// Satıcının ürünleri için bir interface/model tanımlayalım
// Bu model, backend'den gelecek ürün verisine göre şekillenecek
export interface SellerListedProduct {
  id: string | number;
  name: string;
  sku?: string; // Stok kodu (Stock Keeping Unit)
  price: number;
  stockQuantity: number;
  status: 'Yayında' | 'Taslak' | 'Onay Bekliyor' | 'Reddedildi' | 'Stok Tükendi';
  imageUrl?: string; // Küçük resim için
  category?: string; // Ürün kategorisi
  // dateAdded?: Date; // Eklenme tarihi (isteğe bağlı)
}

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
    .status-taslak { background-color: #E1F5FE; color: #0277BD; border-color: #B3E5FC; }
    .status-onay-bekliyor { background-color: #FFF9C4; color: #FBC02D; border-color: #FFF59D; }
    .status-reddedildi { background-color: #FFCDD2; color: #C62828; border-color: #EF9A9A; }
    .status-stok-tukendi { background-color: #F5F5F5; color: #757575; border-color: #E0E0E0; }
  `]
})
export class SellerProductListComponent implements OnInit {
  displayedColumns: string[] = ['imageUrl', 'name', 'sku', 'price', 'stockQuantity', 'status', 'actions'];
  dataSource: SellerListedProduct[] = [];
  isLoading = false;

  constructor(
    private router: Router,
    // private productService: ProductService // Gerçek ProductService'iniz (ileride eklenecek)
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSellerProducts();
  }

  loadSellerProducts(): void {
    this.isLoading = true;
    // TODO: Backend entegrasyonu -> Satıcının kendi ürünlerini servisten çek
    // this.productService.getProductsByCurrentSeller().subscribe({
    //   next: (data) => {
    //     this.dataSource = data;
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     console.error('Satıcı ürünleri yüklenirken hata:', error);
    //     this.isLoading = false;
    //     this.snackBar.open('Ürünler yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
    //   }
    // });

    // Şimdilik sahte (mock) veri ile simülasyon
    setTimeout(() => {
      this.dataSource = [
        {id: 'S001', name: 'El Yapımı Deri Çanta', sku: 'DERI-CNT-001', price: 450.99, stockQuantity: 15, status: 'Yayında', imageUrl: 'https://via.placeholder.com/50/FFA07A/000000?Text=P1', category: 'Aksesuar'},
        {id: 'S002', name: 'Organik Pamuk Tişört - Mavi', sku: 'PAMUK-TS-002-M', price: 120.00, stockQuantity: 0, status: 'Stok Tükendi', imageUrl: 'https://via.placeholder.com/50/ADD8E6/000000?Text=P2', category: 'Giyim'},
        {id: 'S003', name: 'Ahşap Oyuncak Seti', sku: 'AHSAP-OYN-003', price: 280.50, stockQuantity: 5, status: 'Onay Bekliyor', imageUrl: 'https://via.placeholder.com/50/90EE90/000000?Text=P3', category: 'Oyuncak'},
        {id: 'S004', name: 'Seramik Kupa (Özel Tasarım)', sku: 'SERAMIK-KUPA-004', price: 75.00, stockQuantity: 30, status: 'Taslak', imageUrl: 'https://via.placeholder.com/50/D3D3D3/000000?Text=P4', category: 'Mutfak'},
      ];
      this.isLoading = false;
    }, 1500);
  }

  navigateToAddNewProduct(): void {
    this.router.navigate(['/seller/products/new']);
  }

  editProduct(product: SellerListedProduct): void {
    console.log('Düzenlenecek ürün:', product);
    this.router.navigate(['/seller/products/edit', product.id]);
  }

  deleteProduct(product: SellerListedProduct): void {
    console.log('Silinecek ürün:', product);
    // TODO: Onay dialogu (MatDialog) ve backend'e silme isteği
    if (confirm(`'${product.name}' adlı ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      this.isLoading = true;
      // Örnek: this.productService.deleteSellerProduct(product.id).subscribe( ... )
      setTimeout(() => { // Simülasyon
        this.dataSource = this.dataSource.filter(p => p.id !== product.id);
        this.snackBar.open(`'${product.name}' silindi (simülasyon).`, 'Tamam', { duration: 2000 });
        this.isLoading = false;
      }, 1000);
    }
  }

  // Durum etiketleri için CSS sınıfı döndüren yardımcı fonksiyon
  getStatusClass(status: SellerListedProduct['status']): string {
    switch (status) {
      case 'Yayında': return 'status-yayinda';
      case 'Taslak': return 'status-taslak';
      case 'Onay Bekliyor': return 'status-onay-bekliyor';
      case 'Reddedildi': return 'status-reddedildi';
      case 'Stok Tükendi': return 'status-stok-tukendi';
      default: return '';
    }
  }
}
