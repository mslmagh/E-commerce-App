import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Angular Material Modülleri
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

// SellerOrder modelinden status tipini almak için
// >>> Lütfen bu import yolunun doğru olduğundan emin olun <<<
import { SellerOrder } from '../../../seller/orders/seller-order-list/seller-order-list.component';

// Admin Sipariş Detay Modeli/Interface'i
export interface AdminOrderDetail {
  orderId: string;
  orderDate: Date;
  status: SellerOrder['status']; // SellerOrder'daki durumu kullanıyoruz (literal string union)
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
  billingAddress?: AdminOrderDetail['shippingAddress'];
  items: {
    productId: string | number;
    productName: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
    sellerName?: string;
  }[];
  subTotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod?: string;
  trackingNumber?: string;
}

// --- YEREL TİP TANIMI (HATA ÇÖZÜMÜ İÇİN) ---
// getMockOrderDetail metodu içinde kullanılacak mock özet siparişlerin tipini tanımlıyoruz.
// Buradaki status alanı, AdminOrderDetail'deki status tipiyle (SellerOrder['status']) uyumlu olmalı.
type AdminOrderSummary = {
  orderId: string;
  orderDate: Date;
  customerName: string;
  totalAmount: number;
  status: AdminOrderDetail['status']; // <-- Burada AdminOrderDetail'in status tipini kullanıyoruz
  itemCount: number;
};
// --- YEREL TİP TANIMI SONU ---


@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatSnackBarModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
    MatSlideToggleModule, MatFormFieldModule, MatInputModule, MatListModule
  ],
  templateUrl: './admin-order-detail.component.html',
  styles: [`
    .order-detail-page { padding: 20px; max-width: 1200px; margin: 0 auto;}
    .order-detail-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; }
    .product-list-card { grid-column: 1 / -1; }
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
    address p { margin: 0 0 5px 0; line-height: 1.4; }
     .status-chip { padding: 5px 12px; border-radius: 16px; font-size: 0.8em; font-weight: 500; }
     .status-yeni-siparis { background-color: #E3F2FD; color: #0D47A1; }
     .status-hazirlaniyor { background-color: #FFF9C4; color: #F9A825; }
     .status-kargoya-verildi { background-color: #E0F2F1; color: #00695C; }
     .status-teslim-edildi { background-color: #C8E6C9; color: #2E7D32; }
     .status-iptal-edildi { background-color: #FFCDD2; color: #C62828; }
     .status-iade-edildi { background-color: #D1C4E9; color: #4527A0; }
  `]
})
export class AdminOrderDetailComponent implements OnInit, OnDestroy {
  order: AdminOrderDetail | null = null;
  isLoading = false;
  orderId: string | null = null;
  private routeSub!: Subscription;
  private orderSub!: Subscription;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    // private adminOrderService: any,
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.order = null;
        this.isLoading = true;
        const id = params.get('orderId');
        if (id) {
          this.orderId = id;
          console.log('Admin Order Detail: Loading details for order ID:', this.orderId);
          // TODO: Backend'den sipariş detaylarını çek
          // return this.adminOrderService.getOrderDetail(this.orderId);
          return this.getMockOrderDetail(this.orderId).pipe(delay(1000));
        } else {
          this.snackBar.open('Sipariş ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/admin/orders']);
          return of(null);
        }
      })
    ).subscribe({
      next: (data: AdminOrderDetail | null) => {
        if (data) {
          this.order = data;
          console.log('Admin Order Detail: Order data loaded:', this.order);
        } else if (this.orderId) {
           const errorMsg = `Sipariş (${this.orderId}) yüklenirken bir hata oluştu veya bulunamadı.`;
           this.snackBar.open(errorMsg, 'Kapat', { duration: 4000 });
           console.error(errorMsg);
           this.router.navigate(['/admin/orders']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Admin Order Detail: Error loading order details:', err);
        this.isLoading = false;
        this.snackBar.open('Sipariş detayları yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.router.navigate(['/admin/orders']);
      }
    });
  }

   // --- Mock Sipariş Detay Verisi Metodu (Düzeltme Uygulandı) ---
   // mockOrdersSummary dizisi artık doğru AdminOrderSummary tipini kullanıyor
   getMockOrderDetail(id: string): Observable<AdminOrderDetail | null> {
      console.log(`Admin Order Detail: Fetching mock detail for ID: ${id}`);

       // Mock özet siparişler dizisini AdminOrderSummary tipinde tanımla
       const mockOrdersSummary: AdminOrderSummary[] = [
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
             // Eğer AdminOrderDetail'deki SellerOrder['status'] içinde 'İade Edildi' varsa buraya da eklenmeli
             { orderId: 'ORD-2025-021', orderDate: new Date(2025, 4, 8, 11, 0), customerName: 'İade Müşterisi', totalAmount: 100.00, status: 'İade Edildi', itemCount: 1 },
       ];

       const baseOrder = mockOrdersSummary.find(o => o.orderId === id);

       if (!baseOrder) {
           return of(null).pipe(delay(500));
       }

      // Detay bilgileri içeren mock obje
      const detailedOrder: AdminOrderDetail = {
          ...baseOrder, // Status alanı doğru tipte geliyor (AdminOrderSummary sayesinde)
          customer: {
              id: 'CUST-' + Math.floor(Math.random() * 1000),
              name: baseOrder.customerName,
              email: baseOrder.customerName.toLowerCase().replace(' ', '.') + '@example.com'
          },
          shippingAddress: {
              recipientName: baseOrder.customerName,
              addressLine: 'Örnek Mah. Deneme Cad. No: ' + baseOrder.orderId.split('-').pop(),
              city: 'İstanbul',
              postalCode: '34000',
              country: 'Türkiye',
              phone: '555' + Math.floor(1000000 + Math.random() * 9000000).toString()
          },
          // billingAddress: {...},
          items: [
              {
                  productId: 'PROD-' + Math.floor(Math.random() * 100),
                  productName: 'Ürün Adı ' + baseOrder.orderId + '-1',
                  imageUrl: 'https://via.placeholder.com/60x60/EEEEEE/999999?text=Ürün1',
                  quantity: 1,
                  unitPrice: baseOrder.totalAmount > 100 ? baseOrder.totalAmount / baseOrder.itemCount : 100,
                  totalPrice: baseOrder.totalAmount > 100 ? baseOrder.totalAmount / baseOrder.itemCount : 100,
                  sku: 'SKU-' + Math.floor(Math.random() * 10000),
                  sellerName: 'Satıcı ' + String.fromCharCode(65 + Math.floor(Math.random() * 5))
              },
              ...(baseOrder.itemCount > 1 ? [{
                   productId: 'PROD-' + Math.floor(Math.random() * 100),
                   productName: 'Ürün Adı ' + baseOrder.orderId + '-2',
                   imageUrl: 'https://via.placeholder.com/60x60/CCCCCC/555555?text=Ürün2',
                   quantity: baseOrder.itemCount - 1,
                   unitPrice: baseOrder.totalAmount > 100 && baseOrder.itemCount > 1 ? (baseOrder.totalAmount / baseOrder.itemCount) * 0.8 : 50,
                   totalPrice: baseOrder.totalAmount > 100 && baseOrder.itemCount > 1 ? (baseOrder.totalAmount / baseOrder.itemCount) * 0.8 * (baseOrder.itemCount - 1) : 50 * (baseOrder.itemCount - 1),
                    sku: 'SKU-' + Math.floor(Math.random() * 10000),
                    sellerName: 'Satıcı ' + String.fromCharCode(65 + Math.floor(Math.random() * 5))
               }] : [])
          ],
          subTotal: baseOrder.totalAmount > 20 ? baseOrder.totalAmount - 20 : baseOrder.totalAmount,
          shippingCost: baseOrder.totalAmount > 20 ? 20 : 0,
          paymentMethod: 'Kredi Kartı',
          trackingNumber: baseOrder.status === 'Kargoya Verildi' || baseOrder.status === 'Teslim Edildi' ? 'TK' + Math.floor(100000000 + Math.random() * 900000000) : undefined
      };

      return of(detailedOrder).pipe(delay(500));
  }

   // Durum için CSS sınıfı döndüren yardımcı metot
   getStatusClass(status: AdminOrderDetail['status']): string {
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
    if (this.orderSub) this.orderSub.unsubscribe();
  }
}
