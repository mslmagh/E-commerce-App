// src/app/features/seller/orders/seller-order-detail/seller-order-detail.component.ts
// SON HALİ (SellerOrder import edildi ve diğer importlar/tipler eklendi)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Gerekli
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, of, Observable } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Gerekli
import { MatCardModule } from '@angular/material/card'; // Gerekli
import { MatListModule } from '@angular/material/list'; // Gerekli
import { MatDividerModule } from '@angular/material/divider'; // Gerekli
import { MatButtonModule } from '@angular/material/button'; // Gerekli
import { MatIconModule } from '@angular/material/icon'; // Gerekli
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Gerekli
import { MatSelectModule } from '@angular/material/select'; // Gerekli
import { MatTooltipModule } from '@angular/material/tooltip'; // Gerekli
import { MatChipsModule } from '@angular/material/chips'; // Gerekli (status chip için)
import { FormsModule } from '@angular/forms'; // [(ngModel)] için Gerekli
import { HttpErrorResponse } from '@angular/common/http'; // Hata tipi için

// SellerOrder interface'ini list component'inden import edelim
import { SellerOrder } from '../seller-order-list/seller-order-list.component'; // <<-- ÖNEMLİ İMPORT

// import { OrderService } from '../../../../core/services/order.service';

// Detaylı Sipariş Modeli/Interface'i (SellerOrder'dan status'ü alabilir)
export interface SellerOrderDetail {
  orderId: string;
  orderDate: Date;
  status: SellerOrder['status']; // SellerOrder'daki tipi kullan
  customer: {
    id: string | number;
    name: string;
    email?: string;
  };
  shippingAddress: {
    recipientName: string;
    addressLine: string;
    city: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
  billingAddress?: SellerOrderDetail['shippingAddress'];
  items: {
    productId: string | number;
    productName: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
  }[];
  subTotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod?: string;
  trackingNumber?: string;
}

// Sipariş durumları ve geçişler
interface OrderStatusInfo {
  value: SellerOrderDetail['status'];
  viewValue: string;
  nextPossibleStatus?: SellerOrderDetail['status'][];
  cancellable?: boolean;
}

export const ORDER_STATUSES: { [key: string]: OrderStatusInfo } = {
  YENI_SIPARIS: { value: 'Yeni Sipariş', viewValue: 'Yeni Sipariş', nextPossibleStatus: ['Hazırlanıyor', 'İptal Edildi'], cancellable: true },
  HAZIRLANIYOR: { value: 'Hazırlanıyor', viewValue: 'Hazırlanıyor', nextPossibleStatus: ['Kargoya Verildi', 'İptal Edildi'], cancellable: true },
  KARGOYA_VERILDI: { value: 'Kargoya Verildi', viewValue: 'Kargoya Verildi', nextPossibleStatus: ['Teslim Edildi'], cancellable: false },
  TESLIM_EDILDI: { value: 'Teslim Edildi', viewValue: 'Teslim Edildi', nextPossibleStatus: ['İade Edildi'], cancellable: false },
  IPTAL_EDILDI: { value: 'İptal Edildi', viewValue: 'İptal Edildi', nextPossibleStatus: [], cancellable: false },
  IADE_EDILDI: { value: 'İade Edildi', viewValue: 'İade Edildi', nextPossibleStatus: [], cancellable: false }
};

@Component({
  selector: 'app-seller-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatSnackBarModule, MatCardModule, MatListModule,
    MatDividerModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSelectModule, MatTooltipModule, MatChipsModule, FormsModule // FormsModule eklendi
  ],
  templateUrl: './seller-order-detail.component.html',
  styles: [`
    .order-detail-page { padding: 20px; max-width: 1200px; margin: 0 auto;}
    .order-detail-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; }
    .product-list-card { grid-column: 1 / -1; /* Tam genişlik kaplasın */ } /* Ürün listesini en alta alabiliriz veya grid-row ile belirleyebiliriz */
    mat-card-title { font-size: 1.2em; font-weight: 500; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;}
    mat-card-subtitle { color: rgba(0,0,0,.54); margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; font-size: 0.95em;}
    .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0;}
    .info-row strong { color: #333; text-align: right; }
    .product-list-item { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #eee; }
    .product-list-item:last-child { border-bottom: none; }
    .product-image { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 16px; }
    .product-details { flex-grow: 1; }
    .product-name { font-weight: 500; margin-bottom: 4px; display: block;}
    .product-price-qty { font-size: 0.9em; color: grey; }
    .totals-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
    .actions-card mat-form-field { width: 100%; margin-bottom: 16px; }
    .cancel-button { margin-top: 16px; }
    .loading-container { text-align: center; padding: 50px; }
    .status-label { font-weight: bold; margin-right: 8px; }
    address p { margin: 0 0 5px 0; line-height: 1.4; } /* Adres formatlaması */
    /* Durum çipleri için stiller (List component'inden kopyalandı) */
    .status-chip { padding: 5px 12px; border-radius: 16px; font-size: 0.8em; font-weight: 500; }
    .status-yeni-siparis { background-color: #E3F2FD; color: #0D47A1; }
    .status-hazirlaniyor { background-color: #FFF9C4; color: #F9A825; }
    .status-kargoya-verildi { background-color: #E0F2F1; color: #00695C; }
    .status-teslim-edildi { background-color: #C8E6C9; color: #2E7D32; }
    .status-iptal-edildi { background-color: #FFCDD2; color: #C62828; }
    .status-iade-edildi { background-color: #D1C4E9; color: #4527A0; }
  `]
})
export class SellerOrderDetailComponent implements OnInit, OnDestroy {
  order: SellerOrderDetail | null = null;
  isLoading = false;
  orderId: string | null = null;
  private routeSub!: Subscription;
  possibleNextStatuses: OrderStatusInfo[] = [];
  selectedNextStatus: SellerOrderDetail['status'] | null = null;
  isCancellable = false;

  readonly orderStatuses = ORDER_STATUSES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
    // private orderService: OrderService,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.order = null;
        this.isLoading = true;
        this.orderId = params.get('orderId');
        if (!this.orderId) {
          this.snackBar.open('Sipariş ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/seller/orders']);
          return of(null);
        }
        console.log('Fetching details for order ID:', this.orderId);
        // return this.orderService.getSellerOrderById(this.orderId); // Gerçek servis çağrısı
        return this.getMockOrderDetails(this.orderId).pipe(delay(1000)); // Simülasyon
      })
    ).subscribe({
      next: (data: SellerOrderDetail | null) => { // data tipi eklendi
        if (data) {
          this.order = data;
          this.updatePossibleActions();
        } else if (this.orderId) {
          this.snackBar.open(`Sipariş ${this.orderId} yüklenirken bir hata oluştu veya bulunamadı.`, 'Kapat', { duration: 4000 });
          this.router.navigate(['/seller/orders']); // Bulunamadıysa listeye dön
        }
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => { // err tipi eklendi
        console.error('Sipariş detayları yüklenirken hata:', err);
        this.isLoading = false;
        this.snackBar.open('Sipariş detayları yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.router.navigate(['/seller/orders']);
      }
    });
  }

  updatePossibleActions(): void {
    if (!this.order) return;
    // Mevcut durumun bilgilerini bul
    const currentStatusInfo = Object.values(this.orderStatuses).find(s => s.value === this.order?.status);
    // Sonraki olası durumların bilgilerini al
    this.possibleNextStatuses = currentStatusInfo?.nextPossibleStatus
        ?.map(statusValue => Object.values(this.orderStatuses).find(s => s.value === statusValue))
        .filter((statusInfo): statusInfo is OrderStatusInfo => !!statusInfo) // null/undefined filtrele
        ?? [];
    // İptal edilebilirliği ayarla
    this.isCancellable = currentStatusInfo?.cancellable ?? false;
    this.selectedNextStatus = null;
    console.log('Possible next statuses:', this.possibleNextStatuses);
    console.log('Is cancellable:', this.isCancellable);
  }

  updateOrderStatus(): void {
    if (!this.order || !this.selectedNextStatus || this.isLoading) return;

    const newStatus = this.selectedNextStatus;
    console.log(`Updating order ${this.order.orderId} status to: ${newStatus}`);
    this.isLoading = true;

    // TODO: Backend'e güncelleme isteği gönder
    // this.orderService.updateSellerOrderStatus(this.order.orderId, newStatus).subscribe({ ... });
    setTimeout(() => { // Simülasyon
      if (this.order) {
         this.order.status = newStatus;
         this.updatePossibleActions();
         this.snackBar.open(`Sipariş durumu "${newStatus}" olarak güncellendi (simülasyon).`, 'Tamam', { duration: 3000 });
      }
      this.isLoading = false;
    }, 1000);
  }

  cancelOrder(): void {
    if (!this.order || !this.isCancellable || this.isLoading) return;

    if (confirm(`ORD-${this.order.orderId} numaralı siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve müşteriye otomatik iade yapılır.`)) {
      console.log(`Cancelling order ${this.order.orderId}`);
      this.isLoading = true;

      // TODO: Backend'e iptal isteği gönder
      // this.orderService.cancelSellerOrder(this.order.orderId).subscribe({ ... });
      setTimeout(() => { // Simülasyon
        if (this.order) {
          this.order.status = 'İptal Edildi';
          this.updatePossibleActions();
          this.snackBar.open('Sipariş başarıyla iptal edildi (simülasyon). Müşteriye iade işlemi başlatıldı.', 'Tamam', { duration: 5000 });
        }
        this.isLoading = false;
      }, 1500);
    }
  }

  // Sahte sipariş detayı döndüren fonksiyon
  getMockOrderDetails(id: string): Observable<SellerOrderDetail | null> {
    const mockOrderList: SellerOrder[] = [ // SellerOrder tipi artık tanınıyor olmalı
      {orderId: 'ORD-001', orderDate: new Date(2025, 4, 6, 10, 30), customerName: 'Ali Veli Uzunİsimlioğlu', itemCount: 2, totalAmount: 570.99, status: 'Yeni Sipariş'},
      {orderId: 'ORD-002', orderDate: new Date(2025, 4, 5, 15, 0), customerName: 'Ayşe Yılmaz', itemCount: 1, totalAmount: 120.00, status: 'Hazırlanıyor'},
      {orderId: 'ORD-003', orderDate: new Date(2025, 4, 5, 9, 15), customerName: 'Mehmet Öztürk', itemCount: 3, totalAmount: 1250.50, status: 'Kargoya Verildi'},
      {orderId: 'ORD-004', orderDate: new Date(2025, 4, 3, 11, 45), customerName: 'Fatma Kaya', itemCount: 1, totalAmount: 75.00, status: 'Teslim Edildi'},
      {orderId: 'ORD-005', orderDate: new Date(2025, 4, 2, 18, 20), customerName: 'Hasan Demir', itemCount: 5, totalAmount: 850.00, status: 'İptal Edildi'},
      {orderId: 'ORD-006', orderDate: new Date(2025, 4, 7, 8, 0), customerName: 'Zeynep Can', itemCount: 1, totalAmount: 300.00, status: 'Yeni Sipariş'},
      {orderId: 'ORD-007', orderDate: new Date(2025, 4, 7, 11, 10), customerName: 'Mustafa Şahin', itemCount: 4, totalAmount: 980.00, status: 'Hazırlanıyor'},
    ];
    const foundInList = mockOrderList.find(o => o.orderId === id);
    if (!foundInList) return of(null);

    const detail: SellerOrderDetail = {
      ...foundInList,
      customer: { id: 'CUST-123', name: foundInList.customerName, email: 'musteri@ornek.com' },
      shippingAddress: { recipientName: foundInList.customerName, addressLine: 'Deneme Mah. Test Sok. No:1 D:5', city: 'İstanbul', country: 'Türkiye', phone: '5551112233', postalCode: '34000' },
      items: [
        {productId: 'S001', productName: 'El Yapımı Deri Çanta', quantity: 1, unitPrice: 450.99, totalPrice: 450.99, imageUrl: 'https://via.placeholder.com/60/FFA07A/000000?Text=P1', sku: 'DERI-CNT-001'},
        ...(id === 'ORD-001' ? [{productId: 'S004', productName: 'Seramik Kupa', quantity: 1, unitPrice: 75.00, totalPrice: 75.00, imageUrl: 'https://via.placeholder.com/60/D3D3D3/000000?Text=P4', sku: 'SERAMIK-KUPA-004'}] : []),
         ...(id === 'ORD-003' ? [
            {productId: 'S002', productName: 'Organik Pamuk Tişört - Mavi', quantity: 2, unitPrice: 120.00, totalPrice: 240.00, imageUrl: 'https://via.placeholder.com/60/ADD8E6/000000?Text=P2', sku: 'PAMUK-TS-002-M'},
            {productId: 'S003', productName: 'Ahşap Oyuncak Seti', quantity: 1, unitPrice: 280.50, totalPrice: 280.50, imageUrl: 'https://via.placeholder.com/60/90EE90/000000?Text=P3', sku: 'AHSAP-OYN-003'}
         ] : []),
      ],
      subTotal: foundInList.totalAmount - (id === 'ORD-004' ? 0 : 20), // Kargo ücreti varsayımı
      shippingCost: (id === 'ORD-004' ? 0 : 20.00), // ORD-004 kargo bedava olsun
      paymentMethod: 'Kredi Kartı **** 1234'
    };
    if (detail.status === 'Kargoya Verildi' || detail.status === 'Teslim Edildi') { detail.trackingNumber = 'ABC123XYZ789'; }
    return of(detail);
  }

  // Durum çipleri için sınıfı buraya da ekleyelim
   getStatusClass(status: SellerOrder['status']): string {
    switch (status) {
      case 'Yeni Sipariş': return 'status-yeni-siparis';
      case 'Hazırlanıyor': return 'status-hazirlaniyor';
      case 'Kargoya Verildi': return 'status-kargoya-verildi';
      case 'Teslim Edildi': return 'status-teslim-edildi';
      case 'İptal Edildi': return 'status-iptal-edildi';
      case 'İade Edildi': return 'status-iade-edildi';
      default: return '';
    }
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}
