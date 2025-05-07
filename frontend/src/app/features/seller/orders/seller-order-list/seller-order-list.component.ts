// src/app/features/seller/orders/seller-order-list/seller-order-list.component.ts
// SON HALİ (Gerekli importlar ve metodlar eklenmiş)
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf, | date, | currency, [ngClass] için GEREKLİ
import { Router, RouterLink } from '@angular/router'; // RouterLink GEREKLİ (eğer HTML'de varsa)
import { MatTableDataSource, MatTableModule } from '@angular/material/table'; // MatTableDataSource ve Modül GEREKLİ
import { MatButtonModule } from '@angular/material/button'; // MatButtonModule GEREKLİ
import { MatIconModule } from '@angular/material/icon'; // MatIconModule GEREKLİ
import { MatTooltipModule } from '@angular/material/tooltip'; // MatTooltipModule GEREKLİ
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // MatProgressSpinnerModule GEREKLİ
import { MatCardModule } from '@angular/material/card'; // MatCardModule GEREKLİ (mesaj için)
import { MatChipsModule } from '@angular/material/chips'; // MatChipsModule GEREKLİ
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // MatPaginatorModule GEREKLİ
import { MatSort, MatSortModule } from '@angular/material/sort'; // MatSortModule GEREKLİ
import { MatFormFieldModule } from '@angular/material/form-field'; // MatFormFieldModule GEREKLİ
import { MatInputModule } from '@angular/material/input'; // MatInputModule GEREKLİ
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // MatSnackBarModule GEREKLİ

// import { OrderService } from '../../../../core/services/order.service'; // Kendi sipariş servisinizi import edin

// Sipariş listesi için model/interface
export interface SellerOrder {
  orderId: string;
  orderDate: Date;
  customerName: string; // Veya customerId
  totalAmount: number;
  status: 'Yeni Sipariş' | 'Hazırlanıyor' | 'Kargoya Verildi' | 'Teslim Edildi' | 'İptal Edildi' | 'İade Edildi';
  itemCount: number; // Siparişteki ürün sayısı
}

@Component({
  selector: 'app-seller-order-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule,
    MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatSnackBarModule // Snackbar modülü de imports'a eklendi
  ],
  templateUrl: './seller-order-list.component.html',
  styles: [`
    .order-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-field { width: 100%; max-width: 400px; /* Filtre alanı genişliği */ }
    table.mat-mdc-table { width: 100%; box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; overflow-x: auto; /* Küçük ekranlarda tablo scroll edilebilir */ margin-bottom: 16px; }
    .mat-column-orderId { flex: 0 0 100px; } /* Sabit genişlik */
    .mat-column-orderDate { flex: 0 0 140px; }
    .mat-column-customerName { flex: 1 1 150px; /* Esnek genişlik, min 150px */ }
    .mat-column-itemCount { flex: 0 0 80px; text-align: center; }
    .mat-column-totalAmount { flex: 0 0 120px; text-align: right; }
    .mat-column-status { flex: 0 0 150px; text-align: center;}
    .mat-column-actions { flex: 0 0 80px; text-align: center; }
    .loading-spinner-container, .no-orders-message { text-align: center; padding: 40px; }
    .no-orders-message mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; color: grey;}
    /* Durum çipleri için stiller */
    .status-chip { padding: 5px 12px; border-radius: 16px; font-size: 0.8em; font-weight: 500; }
    .status-yeni-siparis { background-color: #E3F2FD; color: #0D47A1; }
    .status-hazirlaniyor { background-color: #FFF9C4; color: #F9A825; } /* Biraz daha koyu sarı */
    .status-kargoya-verildi { background-color: #E0F2F1; color: #00695C; }
    .status-teslim-edildi { background-color: #C8E6C9; color: #2E7D32; }
    .status-iptal-edildi { background-color: #FFCDD2; color: #C62828; }
    .status-iade-edildi { background-color: #D1C4E9; color: #4527A0; }
     /* Tablo hücrelerinde içeriğin taşmasını engelle */
     .mat-mdc-cell, .mat-mdc-header-cell {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Sıralama oklarının hizalanması için */
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }
  `]
})
// AfterViewInit eklendi (Paginator ve Sort için)
export class SellerOrderListComponent implements OnInit, AfterViewInit {
  // Kolon tanımları güncellendi (itemCount eklenmişti)
  displayedColumns: string[] = ['orderId', 'orderDate', 'customerName', 'itemCount', 'totalAmount', 'status', 'actions'];
  // MatTableDataSource kullanıldı
  dataSourceMat = new MatTableDataSource<SellerOrder>();
  isLoading = false;

  // Paginator ve Sort için ViewChild eklendi
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar // Snackbar inject edildi
    // private orderService: OrderService // Gerçek servis
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // Paginator ve Sort'u datasource'a bağlamak için
  ngAfterViewInit(): void {
    this.dataSourceMat.paginator = this.paginator;
    this.dataSourceMat.sort = this.sort;
     // Sort için custom sıralama fonksiyonu (isteğe bağlı, örn: tarih)
     this.dataSourceMat.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'orderDate': return item.orderDate.getTime(); // Tarih için timestamp kullan
          default: return (item as any)[property];
        }
     };
  }

  loadOrders(): void {
    this.isLoading = true;
    // TODO: Backend entegrasyonu...
    setTimeout(() => { // Simülasyon
      const mockData: SellerOrder[] = [
        {orderId: 'ORD-001', orderDate: new Date(2025, 4, 6, 10, 30), customerName: 'Ali Veli Uzunİsimlioğlu', itemCount: 2, totalAmount: 570.99, status: 'Yeni Sipariş'},
        {orderId: 'ORD-002', orderDate: new Date(2025, 4, 5, 15, 0), customerName: 'Ayşe Yılmaz', itemCount: 1, totalAmount: 120.00, status: 'Hazırlanıyor'},
        {orderId: 'ORD-003', orderDate: new Date(2025, 4, 5, 9, 15), customerName: 'Mehmet Öztürk', itemCount: 3, totalAmount: 1250.50, status: 'Kargoya Verildi'},
        {orderId: 'ORD-004', orderDate: new Date(2025, 4, 3, 11, 45), customerName: 'Fatma Kaya', itemCount: 1, totalAmount: 75.00, status: 'Teslim Edildi'},
        {orderId: 'ORD-005', orderDate: new Date(2025, 4, 2, 18, 20), customerName: 'Hasan Demir', itemCount: 5, totalAmount: 850.00, status: 'İptal Edildi'},
        {orderId: 'ORD-006', orderDate: new Date(2025, 4, 7, 8, 0), customerName: 'Zeynep Can', itemCount: 1, totalAmount: 300.00, status: 'Yeni Sipariş'},
        {orderId: 'ORD-007', orderDate: new Date(2025, 4, 7, 11, 10), customerName: 'Mustafa Şahin', itemCount: 4, totalAmount: 980.00, status: 'Hazırlanıyor'},
      ];
      this.dataSourceMat.data = mockData;
      this.isLoading = false;
    }, 1000);
  }

  // applyFilter metodu eklendi
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceMat.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceMat.paginator) {
      this.dataSourceMat.paginator.firstPage();
    }
  }

  // viewOrderDetail metodu eklendi
  viewOrderDetail(order: SellerOrder): void {
    console.log('Sipariş detayına gidiliyor:', order.orderId);
    this.router.navigate(['/seller/orders', order.orderId]);
  }

  // getStatusClass metodu eklendi
  getStatusClass(status: SellerOrder['status']): string {
    switch (status) {
      case 'Yeni Sipariş': return 'status-yeni-siparis';
      case 'Hazırlanıyor': return 'status-hazirlaniyor';
      case 'Kargoya Verildi': return 'status-kargoya-verildi';
      case 'Teslim Edildi': return 'status-teslim-edildi';
      case 'İptal Edildi': return 'status-iptal-edildi';
      case 'İade Edildi': return 'status-iade-edildi'; // İade durumu eklendi
      default: return '';
    }
  }
}
