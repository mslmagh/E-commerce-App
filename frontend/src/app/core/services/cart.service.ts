import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Product } from './product.service';
import { environment } from '../../../environment';
import { AuthService } from './auth.service';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
}

export interface CartItemRequest {
  productId: number;
  quantity: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$: Observable<CartItem[]> = this.cartItemsSource.asObservable();
  
  private cartTotalSource = new BehaviorSubject<number>(0);
  cartTotal$: Observable<number> = this.cartTotalSource.asObservable();
  
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadCart();
  }

  private loadCart(): void {
    if (this.authService.isLoggedIn()) {
      this.fetchCartFromApi();
    } else if (this.isBrowser) {
      const savedCart = localStorage.getItem('localCart');
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart) as CartItem[];
          this.cartItemsSource.next(cartItems);
          this.updateCartTotal(cartItems);
        } catch (e) {
          console.error('Error parsing saved cart', e);
          localStorage.removeItem('localCart');
        }
      }
    }
  }

  private fetchCartFromApi(): void {
    this.http.get<Cart>(`${this.apiUrl}`).pipe(
      tap(cart => {
        console.log('CartService: Cart fetched from API', cart);
        this.cartItemsSource.next(cart.items || []);
        this.updateCartTotal(cart.items || []);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching cart from API', error);
        return throwError(() => new Error('Failed to fetch cart'));
      })
    ).subscribe();
  }

  private updateCartTotal(items: CartItem[]): void {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.cartTotalSource.next(total);
  }

  getCartItems(): CartItem[] {
    return this.cartItemsSource.getValue();
  }

  addToCart(product: Product): void {
    if (this.authService.isLoggedIn()) {
      this.addToCartApi(product);
    } else {
      this.addToLocalCart(product);
    }
  }

  private addToCartApi(product: Product): void {
    const request: CartItemRequest = {
      productId: product.id,
      quantity: 1
    };

    this.http.post<Cart>(`${this.apiUrl}/items`, request).pipe(
      tap(updatedCart => {
        console.log('CartService: Item added to cart via API', updatedCart);
        this.cartItemsSource.next(updatedCart.items || []);
        this.updateCartTotal(updatedCart.items || []);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding item to cart', error);
        return throwError(() => new Error('Failed to add item to cart'));
      })
    ).subscribe();
  }

  private addToLocalCart(product: Product): void {
    const currentItems = this.getCartItems();
    const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);
    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      console.log(`CartService: Updating quantity for product ${product.id}`);
      updatedItems = currentItems.map((item, index) => {
        if (index === existingItemIndex) {
          return { 
            ...item, 
            quantity: item.quantity + 1,
            price: product.price 
          };
        }
        return item;
      });
    } else {
      console.log(`CartService: Adding new product ${product.id} to cart`);
      const newItem: CartItem = {
        id: Date.now(), // Temporary ID for local cart
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl
        },
        quantity: 1,
        price: product.price
      };
      updatedItems = [...currentItems, newItem];
    }

    this.cartItemsSource.next(updatedItems);
    this.updateCartTotal(updatedItems);
    
    if (this.isBrowser) {
      localStorage.setItem('localCart', JSON.stringify(updatedItems));
    }
  }

  decreaseQuantity(productId: number): void {
    if (this.authService.isLoggedIn()) {
      this.updateItemQuantityApi(productId, -1);
    } else {
      this.decreaseLocalQuantity(productId);
    }
  }

  private decreaseLocalQuantity(productId: number): void {
    const currentItems = this.getCartItems();
    const existingItem = currentItems.find(item => item.productId === productId);

    if (!existingItem) {
      console.warn(`CartService: Product ID ${productId} not found for decreasing quantity.`);
      return;
    }

    if (existingItem.quantity > 1) {
      const updatedItems = currentItems.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
      this.cartItemsSource.next(updatedItems);
      this.updateCartTotal(updatedItems);
      if (this.isBrowser) {
        localStorage.setItem('localCart', JSON.stringify(updatedItems));
      }
      console.log(`CartService: Decreased quantity for product ${productId}`);
    } else {
      this.removeFromCart(productId);
    }
  }

  private updateItemQuantityApi(productId: number, change: number): void {
    const currentItems = this.getCartItems();
    const existingItem = currentItems.find(item => item.productId === productId);

    if (!existingItem) {
      console.warn(`CartService: Product ID ${productId} not found for quantity update.`);
      return;
    }

    const newQuantity = existingItem.quantity + change;
    
    if (newQuantity <= 0) {
      this.removeItemFromCartApi(productId);
      return;
    }

    const request: CartItemRequest = {
      productId: productId,
      quantity: newQuantity
    };

    this.http.put<Cart>(`${this.apiUrl}/items/${productId}`, request).pipe(
      tap(updatedCart => {
        console.log(`CartService: Updated quantity for product ${productId} via API`);
        this.cartItemsSource.next(updatedCart.items || []);
        this.updateCartTotal(updatedCart.items || []);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating item quantity', error);
        return throwError(() => new Error('Failed to update item quantity'));
      })
    ).subscribe();
  }

  removeFromCart(productId: number): void {
    if (this.authService.isLoggedIn()) {
      this.removeItemFromCartApi(productId);
    } else {
      this.removeFromLocalCart(productId);
    }
  }

  private removeFromLocalCart(productId: number): void {
    const currentItems = this.getCartItems();
    const updatedItems = currentItems.filter(item => item.productId !== productId);

    if (updatedItems.length !== currentItems.length) {
      this.cartItemsSource.next(updatedItems);
      this.updateCartTotal(updatedItems);
      if (this.isBrowser) {
        localStorage.setItem('localCart', JSON.stringify(updatedItems));
      }
      console.log(`CartService: Removed product ${productId} from local cart.`);
    } else {
      console.warn(`CartService: Product ID ${productId} not found in local cart for removal.`);
    }
  }

  private removeItemFromCartApi(productId: number): void {
    this.http.delete<Cart>(`${this.apiUrl}/items/${productId}`).pipe(
      tap(updatedCart => {
        console.log(`CartService: Removed product ${productId} via API`);
        this.cartItemsSource.next(updatedCart.items || []);
        this.updateCartTotal(updatedCart.items || []);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error removing item from cart', error);
        return throwError(() => new Error('Failed to remove item from cart'));
      })
    ).subscribe();
  }

  clearCart(): void {
    if (this.authService.isLoggedIn()) {
      this.clearCartApi();
    } else {
      this.clearLocalCart();
    }
  }

  private clearLocalCart(): void {
    this.cartItemsSource.next([]);
    this.cartTotalSource.next(0);
    if (this.isBrowser) {
      localStorage.removeItem('localCart');
    }
    console.log('CartService: Local cart cleared.');
  }

  private clearCartApi(): void {
    this.http.delete<void>(`${this.apiUrl}`).pipe(
      tap(() => {
        console.log('CartService: Cart cleared via API');
        this.cartItemsSource.next([]);
        this.cartTotalSource.next(0);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error clearing cart', error);
        return throwError(() => new Error('Failed to clear cart'));
      })
    ).subscribe();
  }

  syncLocalCartWithApi(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    const localCart = this.getCartItems();
    if (!localCart || localCart.length === 0) {
      this.fetchCartFromApi();
      return;
    }

    // Sync local cart items to the server one by one
    const requests = localCart.map(item => {
      const request: CartItemRequest = {
        productId: item.productId,
        quantity: item.quantity
      };
      return this.http.post<Cart>(`${this.apiUrl}/items`, request);
    });

    // After syncing, clear local cart and fetch the updated cart from API
    if (requests.length > 0) {
      // We'll just use the last request to update our cart state
      const lastRequest = requests[requests.length - 1];
      lastRequest.pipe(
        tap(updatedCart => {
          console.log('CartService: Local cart synced with API', updatedCart);
          this.cartItemsSource.next(updatedCart.items || []);
          this.updateCartTotal(updatedCart.items || []);
          if (this.isBrowser) {
            localStorage.removeItem('localCart');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error syncing local cart with API', error);
          return throwError(() => new Error('Failed to sync cart with API'));
        })
      ).subscribe();
    }
  }
}
