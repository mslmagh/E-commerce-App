import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';
import { CreateOrderRequest } from '../models/create-order-request.model';

export interface Address {
  id: number;
  phoneNumber: string;
  country: string;
  city: string;
  postalCode: string;
  addressText: string;
  userId?: number;
  active?: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  status: string;
}

export interface Order {
  id: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  customerId: number;
  customerUsername: string;
  items: OrderItem[];
  shippingAddress: Address;
  stripePaymentIntentId?: string;
}

export interface PaymentIntent {
  clientSecret: string;
}

export interface CancelOrderItemsRequest {
  orderItemIds: number[];
  reason?: string;
}

// Added for updating order status
export interface UpdateOrderStatusRequest {
  newStatus: string; // Backend expects the enum string e.g., "SHIPPED"
}

// Helper map for converting frontend status strings to backend OrderStatus enum strings
// This needs to be aligned with backend's OrderStatus enum and how seller-order-detail component's orderStatusMapForSeller is defined
const frontendToBackendStatusMap: { [key: string]: string } = {
  'Yeni Sipariş': 'PREPARING', // Assuming 'Yeni Sipariş' can transition to 'PREPARING' by seller
  'Hazırlanıyor': 'PREPARING',
  'Kargoya Verildi': 'SHIPPED',
  'Teslim Edildi': 'DELIVERED',
  // 'İptal Edildi' is usually handled by a specific cancel endpoint, not direct status set
  // 'İade Bekliyor' and 'İade Edildi' might also have specific flows
};

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my-orders`)
      .pipe(
        catchError(this.handleError<Order[]>('getUserOrders', []))
      );
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`)
      .pipe(
        catchError(this.handleError<Order>(`getOrderById id=${orderId}`))
      );
  }

  createOrder(orderRequest: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderRequest)
      .pipe(
        catchError(this.handleError<Order>('createOrder'))
      );
  }

  cancelOrderItems(orderId: number, cancelRequest: CancelOrderItemsRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/items/cancel-refund`, cancelRequest)
      .pipe(
        catchError(this.handleError<Order>(`cancelOrderItems orderId=${orderId}`))
      );
  }

  createPaymentIntent(orderId: number): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.apiUrl}/${orderId}/create-payment-intent`, {})
      .pipe(
        catchError(this.handleError<PaymentIntent>(`createPaymentIntent orderId=${orderId}`))
      );
  }

  getOrdersForSeller(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/seller`)
      .pipe(
        catchError(this.handleError<Order[]>('getOrdersForSeller', []))
      );
  }

  // New method for seller to update order status
  updateOrderStatusForSeller(orderId: string, frontendStatus: string): Observable<Order> {
    const backendStatus = frontendToBackendStatusMap[frontendStatus];
    if (!backendStatus) {
      return throwError(() => new Error(`Invalid or unmappable status for seller: ${frontendStatus}`));
    }
    const requestBody: UpdateOrderStatusRequest = { newStatus: backendStatus };
    return this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, requestBody).pipe(
      catchError(this.handleError<Order>(`updateOrderStatusForSeller orderId=${orderId}, newStatus=${backendStatus}`))
    );
  }

  // New method for seller to cancel order items (can be used for full order cancel if all items are included)
  // Note: Backend endpoint is /items/cancel-refund, so it expects item IDs.
  // If the intention is to cancel the *entire order* and backend supports a simpler /cancel for sellers, that would be different.
  // For now, assuming we cancel specific items. If all items belonging to the seller are cancelled,
  // the backend might set the overall order status to CANCELLED.
  cancelOrderItemsForSeller(orderId: string, itemIds: number[], reason?: string): Observable<Order> {
    const requestBody: CancelOrderItemsRequest = { orderItemIds: itemIds, reason: reason || 'Cancelled by seller' };
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/items/cancel-refund`, requestBody).pipe(
      catchError(this.handleError<Order>(`cancelOrderItemsForSeller orderId=${orderId}`))
    );
  }

  // New method for admin to update order status
  updateOrderStatusForAdmin(orderId: string, newStatus: string): Observable<Order> {
    const requestBody: UpdateOrderStatusRequest = { newStatus: newStatus }; // newStatus doğrudan backend uyumlu olmalı
    // Admin endpoint'i /admin/orders/... şeklinde olmalı
    return this.http.put<Order>(`${environment.apiUrl}/admin/orders/${orderId}/status`, requestBody).pipe(
      catchError(this.handleError<Order>(`updateOrderStatusForAdmin orderId=${orderId}, newStatus=${newStatus}`))
    );
  }

  // New method for admin to cancel an order
  cancelOrderForAdmin(orderId: string, reason?: string): Observable<Order> {
    // The backend error message "Admin should use the /cancel endpoint" suggests a specific endpoint.
    // We'll assume a POST request.
    // Backend controller path is /api/orders/{id}/cancel and it takes a reason as @RequestParam.
    // Frontend was sending itemIds in body to /admin/orders/{id}/cancel.
    // Correcting URL and request method to match backend.
    // `this.apiUrl` is already `${environment.apiUrl}/orders`.
    let url = `${this.apiUrl}/${orderId}/cancel`;
    if (reason) {
      // Backend expects 'reason' as a request parameter.
      url += `?reason=${encodeURIComponent(reason)}`;
    }
    // Backend's cancelEntireOrder expects POST, but doesn't have a @RequestBody.
    // Sending an empty object as body for POST, as reason is a query param.
    return this.http.post<Order>(url, {}).pipe(
      catchError(this.handleError<Order>(`cancelOrderForAdmin orderId=${orderId}`))
    );
  }

  // New method for admin to cancel/refund specific order items
  cancelRefundOrderItemsForAdmin(orderId: string, itemIds: number[], reason?: string): Observable<Order> {
    const requestBody: CancelOrderItemsRequest = { 
      orderItemIds: itemIds, 
      reason: reason || 'Cancelled and refunded by admin' 
    };
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/items/cancel-refund`, requestBody).pipe(
      catchError(this.handleError<Order>(`cancelRefundOrderItemsForAdmin orderId=${orderId}`))
    );
  }

  // Kullanıcı için: Sipariş kalemi için iade talebi oluştur
  requestReturnForOrderItem(orderId: number, itemId: number): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/items/${itemId}/return-request`, {})
      .pipe(
        catchError(this.handleError<Order>(`requestReturnForOrderItem orderId=${orderId}, itemId=${itemId}`))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${JSON.stringify(error.error) || error.message}`);
      const errMessage = error.error?.message || error.message || `${operation} failed`;
      return throwError(() => new Error(errMessage));
    };
  }
} 