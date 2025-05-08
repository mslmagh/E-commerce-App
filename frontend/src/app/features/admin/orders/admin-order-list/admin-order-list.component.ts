import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip'; // Tooltip eklendi

// Sipariş listesi için model/interface (Mock data yapısına uygun)
export interface AdminOrder {
  orderId: string;
  orderDate: Date;
  customerName: string;
  totalAmount: number;
  status: 'Yeni Sipariş' | 'Hazırlanıyor' | 'Kargoya Verildi' | 'Teslim Edildi' | 'İptal Edildi'; // Durumlar
  itemCount: number;
}

@Component({
  selector: 'app-admin-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule // Import edildi
  ],
  templateUrl: './admin-order-list.component.html',
  // İsteğe bağlı olarak buraya stilleri ekleyebilirsiniz veya ayrı bir CSS/SCSS dosyası kullanabilirsiniz
  styles: [`
    .order-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-field { width: 100%; max-width: 400px; }
    table.mat-mdc-table { width: 100%; min-width: 800px; box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; overflow-x: auto; margin-bottom: 16px; }
    .mat-column-orderId { flex: 0 0 100px; }
    .mat-column-orderDate { flex: 0 0 140px; }
    .mat-column-customerName { flex: 1 1 150px; }
    .mat-column-itemCount { flex: 0 0 80px; text-align: center; }
    .mat-column-totalAmount { flex: 0 0 120px; text-align: right; }
    .mat-column-status { flex: 0 0 150px; text-align: center;}
    .mat-column-actions { flex: 0 0 80px; text-align: center; }
    .loading-spinner-container, .no-orders-message { text-align: center; padding: 40px; }
    .no-orders-message { color: rgba(0,0,0,0.54); }
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }

    /* Durum chip benzeri stil */
    .status-chip {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 500;
      text-transform: uppercase;
    }
    .status-yeni-siparis { background-color: #E3F2FD; color: #1E88E5; }
    .status-hazirlaniyor { background-color: #FFF9C4; color: #FFB300; }
    .status-kargoya-verildi { background-color: #E0F2F1; color: #00897B; }
    .status-teslim-edildi { background-color: #C8E6C9; color: #43A047; }
    .status-iptal-edildi { background-color: #FFCDD2; color: #E53935; }

    /* Satır hover efekti ve cursor */
    .mat-mdc-row {
      cursor: pointer;
    }
    .mat-mdc-row:hover {
        background-color: rgba(0, 0, 0, 0.04); /* Hafif gri */
    }
  `]
})
export class AdminOrderListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['orderId', 'orderDate', 'customerName', 'itemCount', 'totalAmount', 'status', 'actions'];
  dataSource = new MatTableDataSource<AdminOrder>([]);
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar // Hata/Bilgi mesajları için
    // private adminOrderService: any // Backend servisi şimdilik any
  ) {}

  ngOnInit(): void {
    // Component yüklendiğinde siparişleri çek (şimdilik mock)
    this.loadOrders();
  }

  ngAfterViewInit() {
    // View oluştuktan sonra MatTableDataSource'a paginator ve sort'u bağla
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Kolonlara göre nasıl sıralama yapılacağını tanımla (isteğe bağlı ama önerilir)
     this.dataSource.sortingDataAccessor = (item: AdminOrder, property: string) => {
        switch (property) {
          case 'orderDate': return item.orderDate.getTime(); // Tarihi sayıya çevirerek sırala
          case 'customerName': return item.customerName.toLowerCase(); // Stringleri küçük harfe çevirerek sırala
          // Diğer kolonlar için varsayılan sıralama yeterli olacaktır
          default: return (item as any)[property];
        }
     };
  }

  loadOrders(): void {
    this.isLoading = true;

    // --- MOCK DATA İLE SİMÜLASYON ---
    // Backend hazır olunca bu kısmı gerçek API çağrısı ile değiştireceksiniz.
    setTimeout(() => {
      const mockOrders: AdminOrder[] = [
        { orderId: 'ORD-2025-001', orderDate: new Date(2025, 4, 7, 10, 30), customerName: 'Ali Veli', totalAmount: 550.75, status: 'Yeni Sipariş', itemCount: 2 },
        { orderId: 'ORD-2025-002', orderDate: new Date(2025, 4, 6, 15, 0), customerName: 'Ayşe Yılmaz', totalAmount: 120.00, status: 'Hazırlanıyor', itemCount: 1 },
        { orderId: 'ORD-2025-003', orderDate: new Date(2025, 4, 6, 9, 45), customerName: 'Mehmet Öztürk', totalAmount: 899.50, status: 'Kargoya Verildi', itemCount: 3 },
        { orderId: 'ORD-2025-004', orderDate: new Date(2025, 4, 5, 11, 20), customerName: 'Fatma Kaya', totalAmount: 250.00, status: 'Teslim Edildi', itemCount: 1 },
        { orderId: 'ORD-2025-005', orderDate: new Date(2025, 4, 4, 18, 0), customerName: 'Hasan Can', totalAmount: 400.00, status: 'İptal Edildi', itemCount: 2 },
        { orderId: 'ORD-2025-006', orderDate: new Date(2025, 4, 7, 14, 5), customerName: 'Zeynep Demir', totalAmount: 150.00, status: 'Yeni Sipariş', itemCount: 1 },
         { orderId: 'ORD-2025-007', orderDate: new Date(2025, 4, 3, 10, 0), customerName: 'Mustafa Çelik', totalAmount: 320.00, status: 'Hazırlanıyor', itemCount: 2 },
         { orderId: 'ORD-2025-008', orderDate: new Date(2025, 4, 2, 16, 30), customerName: 'Deniz Aras', totalAmount: 700.00, status: 'Teslim Edildi', itemCount: 4 },
         { orderId: 'ORD-2025-009', orderDate: new Date(2025, 4, 1, 12, 10), customerName: 'Can Mert', totalAmount: 180.00, status: 'Kargoya Verildi', itemCount: 1 },
         { orderId: 'ORD-2025-020', orderDate: new Date(2025, 3, 28, 9, 0), customerName: 'Ebru Şahin', totalAmount: 600.00, status: 'Teslim Edildi', itemCount: 3 },
      ];
      this.dataSource.data = mockOrders;
      this.isLoading = false;
      console.log('Mock siparişler yüklendi:', mockOrders);
    }, 1000); // 1 saniye gecikme ile yükleme simülasyonu
  }

  // Filtreleme metodu
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase(); // Filtre değerini küçük harfe çevirip uygula

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage(); // Filtre uygulandığında ilk sayfaya git
    }
  }

  // Sipariş detayına yönlendirme metodu
  viewOrderDetails(orderId: string): void {
    console.log(`Sipariş detayına gidiliyor: ${orderId}`);
    // Admin panelindeki sipariş detay rotasına yönlendirme
    // Rota 'admin/orders/:orderId' olarak tanımlanmış olmalı
    this.router.navigate(['/admin/orders', orderId]);
  }

  // Sipariş durumuna göre CSS sınıfı döndüren yardımcı metot
  getStatusClass(status: AdminOrder['status']): string {
    switch (status) {
      case 'Yeni Sipariş': return 'status-yeni-siparis';
      case 'Hazırlanıyor': return 'status-hazirlaniyor';
      case 'Kargoya Verildi': return 'status-kargoya-verildi';
      case 'Teslim Edildi': return 'status-teslim-edildi';
      case 'İptal Edildi': return 'status-iptal-edildi';
      default: return ''; // Bilinmeyen durumlar için boş sınıf
    }
  }
}
