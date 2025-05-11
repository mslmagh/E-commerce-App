import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Gerekli
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, of, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
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

import { OrderService, Order as BackendOrder, OrderItem as BackendOrderItem, Address as BackendAddress } from '../../../../core/services/order.service'; // OrderService ve DTO'lar import edildi
import { SellerOrder } from '../seller-order-list/seller-order-list.component'; // <<-- ÖNEMLİ İMPORT

// Backend status'lerini SellerOrder['status'] tipine map'lemek için helper (list component'ten)
const orderStatusMapForSeller: { [key: string]: SellerOrder['status'] } = {
  PENDING: 'Yeni Sipariş',
  CONFIRMED: 'Yeni Sipariş',
  PROCESSING: 'Hazırlanıyor',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  REFUND_PENDING: 'İade Bekliyor',
  REFUNDED: 'İade Edildi',
};

export interface SellerOrderDetailItem {
  orderItemId: number;
  productId: string | number;
  productName: string;
  imageUrl?: string; // Opsiyonel, backend'den gelirse
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string; // Opsiyonel
  status?: string; // Kalem bazlı durum (opsiyonel)
}

export interface SellerOrderDetailAddress {
  recipientName?: string; // Genellikle customerName ile aynı olur
  addressLine: string;
  city: string;
  postalCode?: string;
  country: string;
  phone?: string; // Backend'de varsa
}

export interface SellerOrderDetail {
  orderId: string;
  orderDate: Date;
  status: SellerOrder['status'];
  customer: {
    id: string | number; // customerId
    name: string; // customerUsername
    email?: string; // Backend'de varsa
  };
  shippingAddress: SellerOrderDetailAddress;
  billingAddress?: SellerOrderDetailAddress; // Opsiyonel, backend'de varsa
  items: SellerOrderDetailItem[];
  subTotal: number; // Backend'den gelmiyorsa hesaplanabilir
  shippingCost: number; // Backend'den geliyorsa veya sabit bir değer
  totalAmount: number;
  paymentMethod?: string; // Backend'den geliyorsa
  paymentIntentId?: string; // Stripe vs.
  trackingNumber?: string;
}

interface OrderStatusInfo {
  value: SellerOrderDetail['status'];
  viewValue: string;
  nextPossibleStatus?: SellerOrderDetail['status'][];
  cancellable?: boolean;
  isFinal?: boolean;
}

// ORDER_STATUSES güncellendi, SellerOrder['status'] tipini kullanıyor
export const ORDER_STATUSES_DETAIL: { [key in SellerOrder['status']]: OrderStatusInfo } = {
  'Yeni Sipariş': { value: 'Yeni Sipariş', viewValue: 'Yeni Sipariş', nextPossibleStatus: ['Hazırlanıyor', 'İptal Edildi'], cancellable: true, isFinal: false },
  'Hazırlanıyor': { value: 'Hazırlanıyor', viewValue: 'Hazırlanıyor', nextPossibleStatus: ['Kargoya Verildi', 'İptal Edildi'], cancellable: true, isFinal: false },
  'Kargoya Verildi': { value: 'Kargoya Verildi', viewValue: 'Kargoya Verildi', nextPossibleStatus: ['Teslim Edildi'], cancellable: false, isFinal: false }, // Kargodaki sipariş satıcı tarafından iptal edilemez varsayımı
  'Teslim Edildi': { value: 'Teslim Edildi', viewValue: 'Teslim Edildi', nextPossibleStatus: ['İade Edildi'], cancellable: false, isFinal: true }, // Teslim edilen iade edilebilir ama iptal değil
  'İptal Edildi': { value: 'İptal Edildi', viewValue: 'İptal Edildi', nextPossibleStatus: [], cancellable: false, isFinal: true },
  'İade Bekliyor': { value: 'İade Bekliyor', viewValue: 'İade Bekliyor', nextPossibleStatus: ['İade Edildi'], cancellable: false, isFinal: false }, // Satıcı iadeyi onaylayabilir
  'İade Edildi': { value: 'İade Edildi', viewValue: 'İade Edildi', nextPossibleStatus: [], cancellable: false, isFinal: true }
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
    .status-iade-bekliyor { background-color: #FFCCBC; color: #D84315; }
    .status-iade-edildi { background-color: #D1C4E9; color: #4527A0; }
  `]
})
export class SellerOrderDetailComponent implements OnInit, OnDestroy {
  order: SellerOrderDetail | null = null;
  isLoading = true;
  orderId: string | null = null;
  private routeSub!: Subscription;
  private orderService = inject(OrderService);

  possibleNextStatuses: OrderStatusInfo[] = [];
  selectedNextStatus: SellerOrderDetail['status'] | null = null;
  isCancellable = false;
  currentStatusIsFinal = false;

  readonly orderStatusesMap = ORDER_STATUSES_DETAIL;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.order = null;
        this.isLoading = true;
        this.orderId = params.get('orderId');
        if (!this.orderId || isNaN(Number(this.orderId))) {
          this.snackBar.open('Geçersiz Sipariş ID!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/seller/orders']);
          this.isLoading = false;
          return throwError(() => new Error('Invalid Order ID'));
        }
        console.log('Fetching details for order ID:', this.orderId);
        return this.orderService.getOrderById(Number(this.orderId)).pipe(
          map(backendOrder => {
            console.log('Backend order received:', backendOrder);
            return this.mapBackendOrderToSellerDetail(backendOrder);
          }),
          catchError(err => {
            console.error('Sipariş detayı alınırken hata:', err);
            this.snackBar.open(`Sipariş ${this.orderId} yüklenirken bir hata oluştu veya bulunamadı.`, 'Kapat', { duration: 4000 });
            this.router.navigate(['/seller/orders']);
            this.isLoading = false;
            return throwError(() => err);
          })
        );
      })
    ).subscribe({
      next: (mappedOrder: SellerOrderDetail | null) => {
        console.log('Mapped order:', mappedOrder);
        if (mappedOrder) {
          this.order = mappedOrder;
          this.updatePossibleActions();
        } else {
          this.snackBar.open(`Sipariş ${this.orderId} detayları işlenemedi.`, 'Kapat', { duration: 4000 });
        }
        this.isLoading = false;
      }
    });
  }

  private mapBackendOrderToSellerDetail(bo: BackendOrder): SellerOrderDetail {
    const frontendStatus = orderStatusMapForSeller[bo.status.toUpperCase()] || bo.status as SellerOrder['status'];

    return {
      orderId: bo.id.toString(),
      orderDate: new Date(bo.orderDate),
      status: frontendStatus,
      customer: {
        id: bo.customerId,
        name: bo.customerUsername,
      },
      shippingAddress: this.mapBackendAddressToSellerDetailAddress(bo.shippingAddress, bo.customerUsername),
      items: bo.items.map(item => this.mapBackendItemToSellerDetailItem(item)),
      subTotal: bo.items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0),
      shippingCost: 0,
      totalAmount: bo.totalAmount,
      paymentIntentId: bo.stripePaymentIntentId,
    };
  }

  private mapBackendAddressToSellerDetailAddress(ba: BackendAddress, recipientNameFallback: string): SellerOrderDetailAddress {
    return {
      recipientName: recipientNameFallback,
      addressLine: ba.addressText,
      city: ba.city,
      postalCode: ba.postalCode,
      country: ba.country,
      phone: ba.phoneNumber
    };
  }

  private mapBackendItemToSellerDetailItem(bi: BackendOrderItem): SellerOrderDetailItem {
    return {
      orderItemId: bi.id,
      productId: bi.productId,
      productName: bi.productName,
      quantity: bi.quantity,
      unitPrice: bi.priceAtPurchase,
      totalPrice: bi.priceAtPurchase * bi.quantity,
      status: bi.status
    };
  }

  updatePossibleActions(): void {
    if (!this.order) return;
    const currentStatusKey = Object.keys(this.orderStatusesMap).find(
      key => this.orderStatusesMap[key as SellerOrder['status']].value === this.order?.status
    ) as SellerOrder['status'] | undefined;

    if (currentStatusKey) {
      const currentStatusInfo = this.orderStatusesMap[currentStatusKey];
      this.possibleNextStatuses = currentStatusInfo?.nextPossibleStatus
        ?.map(statusValue => this.orderStatusesMap[statusValue])
        .filter((statusInfo): statusInfo is OrderStatusInfo => !!statusInfo)
        ?? [];
      this.isCancellable = currentStatusInfo?.cancellable ?? false;
      this.currentStatusIsFinal = currentStatusInfo?.isFinal ?? false;
    } else {
      this.possibleNextStatuses = [];
      this.isCancellable = false;
      this.currentStatusIsFinal = true;
    }
    this.selectedNextStatus = null;
  }

  updateOrderStatus(): void {
    if (!this.order || !this.selectedNextStatus || this.isLoading || this.currentStatusIsFinal) {
      return;
    }

    const newStatus = this.selectedNextStatus;
    this.isLoading = true;

    this.orderService.updateOrderStatusForSeller(this.order.orderId, newStatus).pipe(
      catchError(err => {
        this.isLoading = false;
        this.snackBar.open(`Sipariş durumu güncellenirken hata: ${err.message || 'Bilinmeyen bir hata oluştu.'}`, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
        return throwError(() => err);
      })
    ).subscribe((updatedOrder: BackendOrder) => {
      this.isLoading = false;
      // Backend'den dönen güncel sipariş ile frontend'i senkronize et
      this.order = this.mapBackendOrderToSellerDetail(updatedOrder);
      this.updatePossibleActions();
      this.snackBar.open(`Sipariş durumu "${this.order.status}" olarak güncellendi.`, 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
    });
  }

  cancelOrder(): void {
    if (!this.order || !this.isCancellable || this.isLoading || this.currentStatusIsFinal) {
      return;
    }

    const confirmCancel = confirm(`Sipariş No: ${this.order.orderId}\nBu siparişteki size ait ürünleri iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`);
    if (confirmCancel) {
      this.isLoading = true;

      // Satıcıya ait olan veya tüm kalemlerin ID'lerini al
      // Backend yetkilendirmesi zaten satıcının sadece kendi ürünlerini iptal edebilmesini sağlayacaktır.
      const itemIdsToCancel = this.order.items.map(item => item.orderItemId);

      if (itemIdsToCancel.length === 0) {
        this.snackBar.open('İptal edilecek ürün bulunamadı.', 'Kapat', { duration: 3000 });
        this.isLoading = false;
        return;
      }

      this.orderService.cancelOrderItemsForSeller(this.order.orderId, itemIdsToCancel, 'Satıcı tarafından iptal edildi').pipe(
        catchError(err => {
          this.isLoading = false;
          this.snackBar.open(`Sipariş iptal edilirken hata: ${err.message || 'Bilinmeyen bir hata oluştu.'}`, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
          return throwError(() => err);
        })
      ).subscribe((updatedOrder: BackendOrder) => {
        this.isLoading = false;
        this.order = this.mapBackendOrderToSellerDetail(updatedOrder);
        this.updatePossibleActions(); // Olası aksiyonları ve durumu güncelle
        this.snackBar.open('Siparişteki ürünleriniz başarıyla iptal edildi.', 'Tamam', { duration: 5000, panelClass: ['success-snackbar'] });
      });
    }
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

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
