import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../../core/services/order.service'; // Adjusted path
import { Observable, catchError, of } from 'rxjs';
import { CommonModule } from '@angular/common'; // For AsyncPipe, NgFor, NgIf, CurrencyPipe
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router'; // For potential future links to order details
import { MatButtonModule } from '@angular/material/button';


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
    MatButtonModule
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
    this.orders$ = this.orderService.getUserOrders().pipe(
      catchError(err => {
        this.error = typeof err === 'string' ? err : (err.message || 'Siparişler yüklenirken bir hata oluştu.');
        this.isLoading = false;
        return of([]); // Return an empty array on error to prevent breaking the async pipe
      })
    );

    // A bit of a hack to turn off loading spinner after the first emission (success or handled error)
    // A more robust solution might involve tap operators or a dedicated loading service/state management.
    this.orders$.subscribe({
      next: () => { this.isLoading = false; },
      // Error is already caught by catchError, but good practice to have it
      error: () => { this.isLoading = false; } 
    });
  }

  // Helper to track by order ID for *ngFor
  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }
}
