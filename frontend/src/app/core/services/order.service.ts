import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';
import { CreateOrderRequest } from '../models/create-order-request.model';
import { Address } from '../models/address.model';

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
  reason: string;
}

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

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${JSON.stringify(error.error) || error.message}`);
      const errMessage = error.error?.message || error.message || `${operation} failed`;
      return throwError(() => new Error(errMessage));
    };
  }
} 