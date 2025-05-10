import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  status: string;
  imageUrl?: string;
}

export interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface CreateOrderRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  shippingAddressId: number;
  paymentMethod: string;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  paymentMethod: string;
  paymentStatus: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
}

export interface CancelOrderItemsRequest {
  orderItemIds: number[];
  reason: string;
}

export interface BackendOrderItemDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  imageUrl?: string;
}

export interface BackendAddressDto {
  id: number;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface BackendOrderDto {
  id: number;
  orderDate: string;
  status: string;
  totalAmount: number;
  customerId: number;
  customerUsername: string;
  items: BackendOrderItemDto[];
  shippingAddress: BackendAddressDto;
  stripePaymentIntentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  // Get all orders for the current user
  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<Order[]>('getUserOrders', []))
      );
  }

  // Get order details by order ID
  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`)
      .pipe(
        catchError(this.handleError<Order>(`getOrderById id=${orderId}`))
      );
  }

  // Create a new order
  createOrder(orderRequest: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderRequest)
      .pipe(
        catchError(this.handleError<Order>('createOrder'))
      );
  }

  // Cancel specific items in an order
  cancelOrderItems(orderId: number, cancelRequest: CancelOrderItemsRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/cancel-items`, cancelRequest)
      .pipe(
        catchError(this.handleError<Order>(`cancelOrderItems orderId=${orderId}`))
      );
  }

  // Create payment intent for an order (for Stripe integration)
  createPaymentIntent(orderId: number): Observable<PaymentIntent> {
    return this.http.post<PaymentIntent>(`${this.apiUrl}/${orderId}/payment-intent`, {})
      .pipe(
        catchError(this.handleError<PaymentIntent>(`createPaymentIntent orderId=${orderId}`))
      );
  }

  // Confirm payment for an order
  confirmPayment(orderId: number, paymentIntentId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/${orderId}/confirm-payment`, { paymentIntentId })
      .pipe(
        catchError(this.handleError<Order>(`confirmPayment orderId=${orderId}`))
      );
  }

  getOrdersForSeller(): Observable<BackendOrderDto[]> {
    return this.http.get<BackendOrderDto[]>(`${this.apiUrl}/seller`)
      .pipe(
        catchError(this.handleError<BackendOrderDto[]>('getOrdersForSeller', []))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${JSON.stringify(error.error) || error.message}`);
      return throwError(() => new Error(error.error?.message || `${operation} failed`));
    };
  }
} 