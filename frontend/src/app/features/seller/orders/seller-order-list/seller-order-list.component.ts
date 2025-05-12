import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core'; // inject eklendi
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // RouterLink removed
import { MatTableDataSource, MatTableModule } from '@angular/material/table'; // MatTableDataSource eklendi
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // Paginator eklendi
import { MatSort, MatSortModule } from '@angular/material/sort'; // Sort eklendi
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Snackbar için
import { EMPTY, Observable } from 'rxjs'; // EMPTY ve Observable eklendi
import { catchError, map, tap } from 'rxjs/operators'; // rxjs operatörleri eklendi

// OrderService ve DTO'lar import edildi
import { OrderService, Order } from '../../../../core/services/order.service';

export interface SellerOrder {
  orderId: string;
  orderDate: Date;
  customerName: string; // Veya customerId
  totalAmount: number;
  status: 'Yeni Sipariş' | 'Hazırlanıyor' | 'Kargoya Verildi' | 'Teslim Edildi' | 'İptal Edildi' | 'İade Bekliyor' | 'İade Edildi'; // 'İade Bekliyor' eklendi
  itemCount: number; // Siparişteki ürün sayısı
}

// Backend status'lerini frontend status'lerine map'lemek için helper
const orderStatusMap: { [key: string]: SellerOrder['status'] } = {
  PENDING: 'Yeni Sipariş',
  CONFIRMED: 'Yeni Sipariş', // Veya 'Onaylandı' gibi ayrı bir durum
  PROCESSING: 'Hazırlanıyor',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  REFUND_PENDING: 'İade Bekliyor',
  REFUNDED: 'İade Edildi',
  // Backend'den gelebilecek diğer statüler buraya eklenebilir
};

@Component({
  selector: 'app-seller-order-list',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule, // RouterLink removed
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
    .status-iade-bekliyor { background-color: #FFCCBC; color: #D84315; } /* Turuncu tonu */
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
export class SellerOrderListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['orderId', 'orderDate', 'customerName', 'itemCount', 'totalAmount', 'status', 'actions'];
  dataSourceMat = new MatTableDataSource<SellerOrder>();
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Servisler inject edildi
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private orderService = inject(OrderService);

  constructor() {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.dataSourceMat.paginator = this.paginator;
    this.dataSourceMat.sort = this.sort;
     this.dataSourceMat.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'orderDate': return item.orderDate.getTime(); // Tarih için timestamp kullan
          default: return (item as any)[property];
        }
     };
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getOrdersForSeller().pipe(
      map((backendOrders: Order[]): SellerOrder[] => {
        return backendOrders.map(bo => {
          const frontendStatus = orderStatusMap[bo.status.toUpperCase()] || bo.status as SellerOrder['status']; // Eşleşme yoksa orijinal status
          return {
            orderId: bo.id.toString(),
            orderDate: new Date(bo.orderDate),
            customerName: bo.customerUsername,
            totalAmount: bo.totalAmount,
            status: frontendStatus,
            itemCount: bo.items.length
          };
        });
      }),
      tap(mappedOrders => {
        this.dataSourceMat.data = mappedOrders;
        this.isLoading = false;
        if (!mappedOrders || mappedOrders.length === 0) {
          this.snackBar.open('Henüz hiç siparişiniz bulunmuyor.', 'Tamam', { duration: 3000 });
        }
      }),
      catchError(error => {
        this.isLoading = false;
        console.error('Error loading seller orders:', error);
        this.snackBar.open(`Siparişler yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`, 'Kapat', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        return EMPTY; // Hata durumunda observable'ı sonlandır
      })
    ).subscribe();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceMat.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceMat.paginator) {
      this.dataSourceMat.paginator.firstPage();
    }
  }

  viewOrderDetail(order: SellerOrder): void {
    console.log('Sipariş detayına gidiliyor:', order.orderId);
    this.router.navigate(['/seller/orders', order.orderId]);
  }

  getStatusClass(status: SellerOrder['status']): string {
    switch (status) {
      case 'Yeni Sipariş': return 'status-yeni-siparis';
      case 'Hazırlanıyor': return 'status-hazirlaniyor';
      case 'Kargoya Verildi': return 'status-kargoya-verildi';
      case 'Teslim Edildi': return 'status-teslim-edildi';
      case 'İptal Edildi': return 'status-iptal-edildi';
      case 'İade Bekliyor': return 'status-iade-bekliyor';
      case 'İade Edildi': return 'status-iade-edildi';
      default: return '';
    }
  }
}
