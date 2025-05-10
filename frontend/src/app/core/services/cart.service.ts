import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Product } from './product.service';
import { environment } from '../../../environment';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { CartItemRequest } from '../models/cart-item-request.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  private cartSource = new BehaviorSubject<Cart | null>(null);
  cart$: Observable<Cart | null> = this.cartSource.asObservable();
  
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadInitialCart();
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('CartService: No auth token found. API requests for protected cart endpoints might fail.');
    }
    return { headers };
  }

  private loadInitialCart(): void {
    if (this.authService.isLoggedIn()) {
      this.fetchCartFromServer();
    } else if (this.isBrowser) {
      const localCartJson = localStorage.getItem('anonymousCart');
      if (localCartJson) {
        try {
          const localCart = JSON.parse(localCartJson) as Cart;
          if (localCart && localCart.items !== undefined && localCart.grandTotal !== undefined) {
             this.cartSource.next(localCart);
          } else {
            localStorage.removeItem('anonymousCart'); 
            this.cartSource.next(this.createEmptyLocalCart());
          }
        } catch (e) {
          console.error('Error parsing local cart', e);
          localStorage.removeItem('anonymousCart');
          this.cartSource.next(this.createEmptyLocalCart());
        }
      } else {
        this.cartSource.next(this.createEmptyLocalCart());
      }
    }
  }

  private fetchCartFromServer(): void {
    this.http.get<Cart>(`${this.apiUrl}`, this.getHttpOptions()).pipe(
      tap(cart => {
        console.log('CartService: Cart fetched from API', cart);
        this.cartSource.next(cart);
        if (this.isBrowser && cart) {
            localStorage.removeItem('anonymousCart');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching cart from API', error);
        if (error.status === 404) { 
            this.cartSource.next(null);
            if (this.isBrowser) { localStorage.removeItem('anonymousCart'); }
        } else {
            this.cartSource.next(null); 
        }
        return throwError(() => new Error('Failed to fetch cart from server. ' + (error.error?.message || error.message)));
      })
    ).subscribe();
  }

  private saveCartToLocalStorage(cart: Cart | null): void {
    if (this.isBrowser && !this.authService.isLoggedIn()) {
      if (cart && cart.items.length > 0) {
        localStorage.setItem('anonymousCart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('anonymousCart');
      }
    }
  }
  
  getCurrentCartValue(): Cart | null {
    return this.cartSource.getValue();
  }

  getCart(): Observable<Cart | null> {
    if (!this.cartSource.getValue() && this.authService.isLoggedIn()) {
        this.fetchCartFromServer();
    }
    return this.cart$;
  }

  addItem(itemRequest: CartItemRequest, productDetails?: Product): Observable<Cart> {
    if (!itemRequest || itemRequest.quantity < 1) {
        return throwError(() => new Error('Invalid item request for adding to cart.'));
    }

    if (this.authService.isLoggedIn()) {
      return this.http.post<Cart>(`${this.apiUrl}/items`, itemRequest, this.getHttpOptions()).pipe(
        tap(updatedCart => {
          console.log('CartService: Item added/updated via API', updatedCart);
          this.cartSource.next(updatedCart);
        }),
        catchError(this.handleError('addItemToCart (API)'))
      );
    } else {
      if (!productDetails) {
        console.error('Product details are required to add item to local cart.');
        return throwError(() => new Error('Product details needed for local cart.'));
      }
      const currentCart = this.getCurrentCartValue() || this.createEmptyLocalCart();
      const existingItemIndex = currentCart.items.findIndex(i => i.productId === itemRequest.productId);

      if (existingItemIndex > -1) {
        currentCart.items[existingItemIndex].quantity += itemRequest.quantity;
        currentCart.items[existingItemIndex].totalPrice = currentCart.items[existingItemIndex].unitPrice * currentCart.items[existingItemIndex].quantity;
      } else {
        const newItem: CartItem = {
            itemId: Date.now(),
            productId: itemRequest.productId,
            productName: productDetails.name,
            quantity: itemRequest.quantity,
            unitPrice: productDetails.price,
            totalPrice: productDetails.price * itemRequest.quantity
        };
        currentCart.items.push(newItem);
      }
      this.recalculateLocalCartTotals(currentCart);
      this.cartSource.next(currentCart);
      this.saveCartToLocalStorage(currentCart);
      return new Observable<Cart>(observer => { 
        observer.next(currentCart);
        observer.complete();
      });
    }
  }

  updateItemQuantity(itemId: number, newQuantity: number): Observable<Cart> {
    if (newQuantity < 1) {
      return this.removeItem(itemId);
    }

    const currentCart = this.getCurrentCartValue();
    const itemToUpdate = currentCart?.items.find(item => item.itemId === itemId);

    if (!itemToUpdate) {
      return throwError(() => new Error('Item not found in cart to update quantity.'));
    }
    const itemUpdateRequest: CartItemRequest = { productId: itemToUpdate.productId, quantity: newQuantity };

    if (this.authService.isLoggedIn()) {
      return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, itemUpdateRequest, this.getHttpOptions()).pipe(
        tap(updatedCart => {
          console.log(`CartService: Updated quantity for item ${itemId} via API`);
          this.cartSource.next(updatedCart);
        }),
        catchError(this.handleError('updateItemQuantity (API)'))
      );
    } else {
      const localCart = this.getCurrentCartValue();
      if (!localCart) return throwError(() => new Error('No local cart to update.'));
      
      const existingItemIndex = localCart.items.findIndex(i => i.itemId === itemId); 
      if (existingItemIndex > -1) {
        localCart.items[existingItemIndex].quantity = newQuantity;
        localCart.items[existingItemIndex].totalPrice = localCart.items[existingItemIndex].unitPrice * newQuantity;
        this.recalculateLocalCartTotals(localCart);
        this.cartSource.next(localCart);
        this.saveCartToLocalStorage(localCart);
      } else {
        return throwError(() => new Error('Item not found in local cart to update.'));
      }
       return new Observable<Cart>(observer => {
        observer.next(localCart);
        observer.complete();
      });
    }
  }

  removeItem(itemId: number): Observable<Cart> {
    if (this.authService.isLoggedIn()) {
      return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`, this.getHttpOptions()).pipe(
        tap(updatedCart => {
          console.log(`CartService: Removed item ${itemId} via API`);
          this.cartSource.next(updatedCart?.items?.length > 0 ? updatedCart : null);
        }),
        catchError(this.handleError('removeItem (API)'))
      );
    } else {
      const currentCart = this.getCurrentCartValue();
      if (!currentCart) return throwError(() => new Error('No local cart to remove from.'));

      currentCart.items = currentCart.items.filter(i => i.itemId !== itemId);
      if (currentCart.items.length === 0) {
          this.cartSource.next(null);
          this.saveCartToLocalStorage(null);
           return new Observable<Cart>(observer => { observer.next(null as any); observer.complete(); });
      } else {
          this.recalculateLocalCartTotals(currentCart);
          this.cartSource.next(currentCart);
          this.saveCartToLocalStorage(currentCart);
           return new Observable<Cart>(observer => { observer.next(currentCart); observer.complete(); });
      }
    }
  }
  
  private recalculateLocalCartTotals(cart: Cart): void {
    if (!cart || !cart.items) {
      if(cart) cart.grandTotal = 0;
      return;
    }
    cart.grandTotal = cart.items.reduce((total, item) => {
        const itemTotalPrice = (item.unitPrice || 0) * (item.quantity || 0);
        return total + itemTotalPrice;
    }, 0);
  }

  private createEmptyLocalCart(): Cart {
      return {
          cartId: Date.now(), 
          userId: 0, 
          items: [],
          grandTotal: 0
      };
  }

  clearCart(): Observable<Cart | null> { 
    if (this.authService.isLoggedIn()) {
        console.warn("CartService.clearCart() for API user: Backend endpoint for clearing cart is missing. Simulating local clear.");
        const oldCart = this.getCurrentCartValue();
        this.cartSource.next(null);
        return new Observable<Cart|null>(observer => { observer.next(null); observer.complete(); });
    } else {
      this.cartSource.next(null);
      this.saveCartToLocalStorage(null);
      return new Observable<Cart|null>(observer => { observer.next(null); observer.complete(); });
    }
  }

  private handleError(operation: string = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`${operation} failed: ${error.message}`, error);
      let userMessage = `An error occurred during ${operation}. Please try again.`;
      if (error.error && typeof error.error.message === 'string') {
          userMessage = error.error.message; 
      } else if (error.error?.error && typeof error.error.error === 'string') {
          userMessage = error.error.error;
      }
      return throwError(() => new Error(userMessage));
    };
  }
  
  onLogout(): void {
    this.cartSource.next(null);
    if (this.isBrowser) {
      localStorage.removeItem('anonymousCart');
    }
    console.log('CartService: Cleared cart data on logout.');
  }

  syncCartOnLogin(): void {
    if (this.authService.isLoggedIn()) {
        console.log("CartService: User logged in, ensuring server cart is primary.");
        this.fetchCartFromServer(); 
    }
  }
}
