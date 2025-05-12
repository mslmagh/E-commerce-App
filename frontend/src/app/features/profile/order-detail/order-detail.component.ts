import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, Order, OrderItem } from '../../../core/services/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatListModule, MatProgressSpinnerModule, MatIconModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  isLoading = true;
  error: string | null = null;
  orderId: string | null = null;
  requestingItemId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (!this.orderId) {
      this.error = 'Sipariş ID bulunamadı.';
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.orderService.getOrderById(Number(this.orderId)).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Sipariş detayları yüklenirken bir hata oluştu.';
        this.isLoading = false;
      }
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Beklemede';
      case 'PROCESSING': return 'İşleniyor';
      case 'SHIPPED': return 'Kargolandı';
      case 'DELIVERED': return 'Teslim Edildi';
      case 'CANCELLED': return 'İptal Edildi';
      case 'REFUNDED': return 'İade Edildi';
      case 'RETURN_REQUESTED': return 'İade Talebi Oluşturuldu';
      default: return status;
    }
  }

  canRequestReturn(item: OrderItem): boolean {
    return item.status === 'DELIVERED';
  }

  requestReturn(item: OrderItem): void {
    if (!this.orderId) return;
    if (!confirm(`"${item.productName}" ürünü için iade talebi oluşturmak istediğinize emin misiniz?`)) return;
    this.requestingItemId = item.id;
    this.orderService.requestReturnForOrderItem(Number(this.orderId), item.id).subscribe({
      next: (updatedOrder: Order) => {
        this.order = updatedOrder;
        this.snackBar.open('İade talebiniz başarıyla oluşturuldu.', 'Kapat', { duration: 3000 });
        this.requestingItemId = null;
      },
      error: (err: any) => {
        this.snackBar.open(err.message || 'İade talebi oluşturulurken bir hata oluştu.', 'Kapat', { duration: 4000 });
        this.requestingItemId = null;
      }
    });
  }
} 