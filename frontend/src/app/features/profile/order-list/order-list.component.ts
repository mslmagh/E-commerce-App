import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order.service'; // Adjusted path
import { Observable, catchError, of, map } from 'rxjs';
import { CommonModule } from '@angular/common'; // For AsyncPipe, NgFor, NgIf, CurrencyPipe
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router'; // For potential future links to order details
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// Define OrderStatus enum locally for strong typing
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  INCOMPLETE = 'INCOMPLETE',
  PAYMENT_FAILED = 'PAYMENT_FAILED'
}

@Component({
  selector: 'app-order-list',
  standalone: true, // Added standalone
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {
  orders$!: Observable<Order[]>;
  isLoading = true;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.error = null; // Reset error on init
    this.orders$ = this.orderService.getUserOrders().pipe(
      map(orders => orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())), // Sort orders by date descending
      catchError(err => {
        console.error('Error fetching orders:', err); // Log the actual error
        this.error = typeof err === 'string' ? err : (err.error?.message || err.message || 'Siparişler yüklenirken bir hata oluştu.');
        this.isLoading = false;
        return of([]); // Return an empty array on error to prevent breaking the async pipe
      })
    );

    // No need for the separate subscribe block anymore as loading is handled within the stream
    // We can rely on the async pipe to manage the subscription and set isLoading false via tap or finalize if needed,
    // but for simplicity, the catchError block handles the loading=false on error.
    // The async pipe will show the template once data arrives, effectively meaning loading is done.
    // We might need a finalize operator if we want to be absolutely sure loading stops even if the source completes without emitting.
    // For now, this simplification should work.

    // If you want to explicitly stop loading on first emission (success or error handled):
    this.orders$.pipe(
      map(orders => {
        this.isLoading = false; // Stop loading once data is processed (sorted or error caught)
        return orders;
      })
    ).subscribe(); // Minimal subscribe just to trigger the pipe flow and loading=false
  }

  // Helper to track by order ID for *ngFor
  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  // Helper methods for status display
  getStatusClass(status: string): string {
    switch (status) {
      case OrderStatus.PENDING:
      case OrderStatus.PROCESSING:
        return 'status-pending';
      case OrderStatus.SHIPPED:
        return 'status-shipped';
      case OrderStatus.DELIVERED:
        return 'status-delivered';
      case OrderStatus.CANCELLED:
      case OrderStatus.REFUNDED:
        return 'status-cancelled';
      case OrderStatus.INCOMPLETE:
        return 'status-incomplete';
      case OrderStatus.PAYMENT_FAILED:
        return 'status-payment-failed';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case OrderStatus.PENDING: return 'Beklemede';
      case OrderStatus.PROCESSING: return 'İşleniyor';
      case OrderStatus.SHIPPED: return 'Kargolandı';
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      case OrderStatus.REFUNDED: return 'İade Edildi';
      case OrderStatus.INCOMPLETE: return 'Eksik Bilgi';
      case OrderStatus.PAYMENT_FAILED: return 'Ödeme Başarısız';
      default: return status; // Return the original status if no mapping is found
    }
  }
}
