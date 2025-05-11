import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environment';

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
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/services/order.service';

// Aligning with OrderStatusType from AdminOrderListComponent
type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAYMENT_FAILED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
// REFUNDED durumu admin listesinde yoktu, gerekirse eklenebilir veya backend'den gelenlere göre şekillenir.

export interface AdminOrderDetailItem {
  productId: string | number;
  productName: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  sellerName?: string;
}

export interface AdminOrderDetail {
  orderId: string;
  orderDate: Date;
  status: OrderStatus;
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
  items: AdminOrderDetailItem[];
  subTotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod?: string;
  trackingNumber?: string;
}

type AdminOrderSummary = {
  orderId: string;
  orderDate: Date;
  customerName: string;
  totalAmount: number;
  status: AdminOrderDetail['status'];
  itemCount: number;
};

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatSnackBarModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
    MatSlideToggleModule, MatFormFieldModule, MatInputModule, MatListModule,
    MatSelectModule,
    FormsModule
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
     .status-PENDING { background-color: #FFF9C4; color: #F57F17; border: 1px solid #FFF59D;}
     .status-PROCESSING { background-color: #E1F5FE; color: #0277BD; border: 1px solid #B3E5FC;}
     .status-PAYMENT_FAILED { background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2;}
     .status-PREPARING { background-color: #FFE0B2; color: #E65100; border: 1px solid #FFCC80;}
     .status-SHIPPED { background-color: #E0F2F1; color: #00695C; border: 1px solid #B2DFDB;}
     .status-DELIVERED { background-color: #C8E6C9; color: #2E7D32; border: 1px solid #A5D6A7;}
     .status-CANCELLED { background-color: #F5F5F5; color: #757575; border: 1px solid #EEEEEE;}
  `]
})
export class AdminOrderDetailComponent implements OnInit, OnDestroy {
  order: AdminOrderDetail | null = null;
  isLoading = true;
  isUpdatingStatus = false;
  orderId: string | null = null;
  private routeSub!: Subscription;

  allOrderStatuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED'];
  selectedStatusForUpdate: OrderStatus | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private httpClient: HttpClient,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.order = null;
        const id = params.get('orderId');
        if (id) {
          this.orderId = id;
          console.log('Admin Order Detail: Loading details for order ID:', this.orderId);
          return this.httpClient.get<AdminOrderDetail>(`${environment.apiUrl}/admin/orders/${this.orderId}`);
        } else {
          this.snackBar.open('Sipariş ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/admin/orders']);
          this.isLoading = false;
          return of(null);
        }
      })
    ).subscribe({
      next: (data: AdminOrderDetail | null) => {
        if (data) {
          this.order = data;
          console.log('Admin Order Detail: Order data loaded from API:', this.order);
          this.selectedStatusForUpdate = this.order.status;
        } else if (this.orderId) {
           const errorMsg = `Sipariş (${this.orderId}) yüklenirken bir hata oluştu veya bulunamadı.`;
           this.snackBar.open(errorMsg, 'Kapat', { duration: 4000 });
           console.error(errorMsg);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Admin Order Detail: Error loading order details from API:', err);
        this.isLoading = false;
        this.snackBar.open(`Sipariş detayları yüklenirken bir hata oluştu: ${err.message || 'Bilinmeyen Hata'}`, 'Kapat', { duration: 5000 });
        this.router.navigate(['/admin/orders']);
      }
    });
  }

  onUpdateOrderStatus(): void {
    console.log('AdminOrderDetailComponent: onUpdateOrderStatus called with orderId:', this.orderId, 'and selectedStatusForUpdate:', this.selectedStatusForUpdate);
    if (!this.order || !this.selectedStatusForUpdate || this.order.status === this.selectedStatusForUpdate) {
      this.snackBar.open('Güncellenecek yeni bir durum seçilmedi veya durum zaten aynı.', 'Kapat', { duration: 3000 });
      console.log('AdminOrderDetailComponent: Update condition not met or status is the same.');
      return;
    }
    if (!this.orderId) {
        this.snackBar.open('Sipariş ID bulunamadı, durum güncellenemiyor.', 'Kapat', { duration: 3000 });
        console.error('AdminOrderDetailComponent: Order ID is missing, cannot update status.');
        return;
    }

    this.isUpdatingStatus = true;
    console.log('AdminOrderDetailComponent: Calling orderService.updateOrderStatusForAdmin');
    this.orderService.updateOrderStatusForAdmin(this.orderId, this.selectedStatusForUpdate).subscribe({
      next: (updatedOrderData: Order) => {
        console.log('AdminOrderDetailComponent: updateOrderStatusForAdmin successful, response:', updatedOrderData);
        if (this.order) {
            const mappedOrderData = {
                ...updatedOrderData,
                orderId: updatedOrderData.id.toString(),
                orderDate: new Date(updatedOrderData.orderDate),
                status: updatedOrderData.status as OrderStatus,
                customer: {
                    id: updatedOrderData.customerId,
                    name: updatedOrderData.customerUsername,
                    email: (this.order && this.order.customer) ? this.order.customer.email : undefined
                },
                shippingAddress: {
                    recipientName: updatedOrderData.customerUsername,
                    addressLine: updatedOrderData.shippingAddress.addressText,
                    city: updatedOrderData.shippingAddress.city,
                    postalCode: updatedOrderData.shippingAddress.postalCode,
                    country: updatedOrderData.shippingAddress.country,
                    phone: updatedOrderData.shippingAddress.phoneNumber
                },
                items: updatedOrderData.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.priceAtPurchase,
                    totalPrice: item.priceAtPurchase * item.quantity,
                    imageUrl: undefined,
                    sku: undefined,
                    sellerName: undefined
                })),
            };
            this.order = { ...this.order, ...mappedOrderData };
        }
        this.selectedStatusForUpdate = updatedOrderData.status as OrderStatus;
        this.snackBar.open(`Sipariş durumu başarıyla ${updatedOrderData.status} olarak güncellendi.`, 'Kapat', { duration: 3000 });
        this.isUpdatingStatus = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('AdminOrderDetailComponent: Error updating order status from API:', err);
        this.snackBar.open(`Sipariş durumu güncellenirken bir hata oluştu: ${err.error?.message || err.message || 'Bilinmeyen Hata'}`, 'Kapat', { duration: 5000 });
        this.isUpdatingStatus = false;
      }
    });
  }

  getStatusClass(status: OrderStatus | undefined): string {
    if (!status) return '';
    switch (status) {
      case 'PENDING': return 'status-PENDING';
      case 'PROCESSING': return 'status-PROCESSING';
      case 'PREPARING': return 'status-PREPARING';
      case 'SHIPPED': return 'status-SHIPPED';
      case 'DELIVERED': return 'status-DELIVERED';
      case 'CANCELLED': return 'status-CANCELLED';
      case 'PAYMENT_FAILED': return 'status-PAYMENT_FAILED';
      default:
        console.warn("AdminOrderDetailComponent: Unknown status in getStatusClass: ", status);
        return '';
    }
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}
