import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, map } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { Cart } from '../../core/models/cart.model';
import { CartItem } from '../../core/models/cart-item.model';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatSnackBarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {

  cart$: Observable<Cart | null>;
  currentCart: Cart | null = null;
  selectedItems: Map<number, boolean> = new Map();
  isAllSelected: boolean = false;
  isLoading: boolean = false;
  itemUpdateInProgress: Map<number, boolean> = new Map();

  private cartSubscription?: Subscription;
  isUserLoggedIn: boolean = false;
  private authSubscription?: Subscription;

  constructor(
    private cartService: CartService, 
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
    ) {
    this.cart$ = this.cartService.cart$;
  }

  ngOnInit(): void {
    console.log('CartComponent loaded');
    this.isLoading = true;

    this.authSubscription = this.authService.isLoggedIn$.subscribe(loggedIn => {
      this.isUserLoggedIn = loggedIn;
      if (loggedIn && !this.cartService.getCurrentCartValue()) {
        this.cartService.getCart().subscribe();
      }
    });

    this.cartSubscription = this.cart$.subscribe(cart => {
      console.log('Cart data received in component:', cart);
      this.currentCart = cart;
      this.selectedItems.clear();
      this.updateSelectAllState();
      this.isLoading = false;
    });

    if (!this.currentCart) {
        const initialCartValue = this.cartService.getCurrentCartValue();
        if(initialCartValue) {
            this.currentCart = initialCartValue;
            this.updateSelectAllState();
            this.isLoading = false;
        } else if (this.isUserLoggedIn) {
             this.cartService.getCart().subscribe(); 
        } else {
            this.isLoading = false;
        }
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  onItemSelectChange(item: CartItem, event: MatCheckboxChange): void {
    const isSelected = event.checked;
    if (isSelected) {
      this.selectedItems.set(item.itemId, true);
    } else {
      this.selectedItems.delete(item.itemId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    if (!this.currentCart || !this.currentCart.items || this.currentCart.items.length === 0) {
      this.isAllSelected = false;
      return;
    }
    this.isAllSelected = this.currentCart.items.every((item: CartItem) => this.selectedItems.get(item.itemId));
  }

  onSelectAllChange(event: MatCheckboxChange): void {
    const isSelected = event.checked;
    this.isAllSelected = isSelected;
    this.currentCart?.items.forEach((item: CartItem) => {
      if (isSelected) {
        this.selectedItems.set(item.itemId, true);
      } else {
        this.selectedItems.delete(item.itemId);
      }
    });
  }

  private handleItemUpdate<T>(itemId: number, operation: Observable<T>, successMessage: string, errorMessagePrefix: string) {
    this.itemUpdateInProgress.set(itemId, true);
    operation.subscribe({
        next: () => {
            this.snackBar.open(successMessage, 'Tamam', { duration: 2000 });
            this.itemUpdateInProgress.delete(itemId);
        },
        error: (err) => {
            this.snackBar.open(`${errorMessagePrefix}: ${err.message}`, 'Kapat', { duration: 3000 });
            this.itemUpdateInProgress.delete(itemId);
        }
    });
  }

  increaseQuantity(item: CartItem): void {
    if (this.itemUpdateInProgress.get(item.itemId)) return;
    const newQuantity = item.quantity + 1;
    this.handleItemUpdate(
        item.itemId, 
        this.cartService.updateItemQuantity(item.itemId, newQuantity),
        `'${item.productName}' miktarı güncellendi.`, 
        `Miktar güncellenirken hata oluştu`
    );
  }

  decreaseQuantity(item: CartItem): void {
    if (this.itemUpdateInProgress.get(item.itemId)) return; 
    const newQuantity = item.quantity - 1;

    this.handleItemUpdate(
        item.itemId, 
        this.cartService.updateItemQuantity(item.itemId, newQuantity),
        newQuantity > 0 ? `'${item.productName}' miktarı güncellendi.` : `'${item.productName}' sepetten çıkarıldı.`, 
        `Miktar güncellenirken/ürün çıkarılırken hata oluştu`
    );
  }

  removeFromCart(item: CartItem): void {
    if (this.itemUpdateInProgress.get(item.itemId)) return; 
    this.handleItemUpdate(
        item.itemId, 
        this.cartService.removeItem(item.itemId),
        `'${item.productName}' sepetten çıkarıldı.`, 
        `Ürün çıkarılırken hata oluştu`
    );
  }
  
  deleteSelectedItems(): void {
    const itemsToDelete = this.currentCart?.items.filter((item: CartItem) => this.selectedItems.get(item.itemId));
    if (!itemsToDelete || itemsToDelete.length === 0) {
      this.snackBar.open('Lütfen silmek için en az bir ürün seçin.', 'Kapat', { duration: 3000 });
      return;
    }
    this.isLoading = true;
    let completedOperations = 0;
    let anyError = false;

    itemsToDelete.forEach((item: CartItem) => {
        if (this.itemUpdateInProgress.get(item.itemId)) {
            completedOperations++;
            if (completedOperations === itemsToDelete.length && !anyError) {
                 this.snackBar.open(`${itemsToDelete.length - (itemsToDelete.filter(it => this.itemUpdateInProgress.get(it.itemId)).length)} ürün başarıyla çıkarıldı. Bazıları zaten işleniyordu.`, 'Tamam', { duration: 2500 });
                 this.updateSelectAllState();
                 this.isLoading = false;
            } else if (completedOperations === itemsToDelete.length && anyError) {
                this.isLoading = false;
            }
            return; 
        }
        this.itemUpdateInProgress.set(item.itemId, true);
        this.cartService.removeItem(item.itemId).subscribe({
            next: () => {
                console.log(`Item ${item.itemId} deleted.`);
                this.itemUpdateInProgress.delete(item.itemId);
                this.selectedItems.delete(item.itemId);
            },
            error: (err) => {
                console.error(`Error deleting item ${item.itemId}:`, err);
                this.itemUpdateInProgress.delete(item.itemId);
                this.snackBar.open(`'${item.productName}' silinirken hata: ${err.message}`, 'Kapat', {duration: 3000});
                anyError = true;
            },
            complete: () => {
                completedOperations++;
                if (completedOperations === itemsToDelete.length) {
                    if (!anyError) {
                        this.snackBar.open(`${itemsToDelete.length} ürün sepetten çıkarıldı.`, 'Tamam', { duration: 2500 });
                    }
                    this.updateSelectAllState();
                    this.isLoading = false;
                }
            }
        });
    });
  }

  get grandTotal(): number {
    return this.currentCart?.grandTotal || 0;
  }

  get totalItemsInCart(): number {
    if (!this.currentCart || !this.currentCart.items) return 0;
    return this.currentCart.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  }

  clearCart(): void {
    this.isLoading = true;
    this.cartService.clearCart().subscribe({
        next: () => {
            this.snackBar.open('Sepet temizlendi.', 'Tamam', { duration: 2000 });
            this.isLoading = false;
        },
        error: (err) => {
            this.snackBar.open(`Sepet temizlenirken hata: ${err.message}`, 'Kapat', { duration: 3000 });
            this.isLoading = false;
        }
    });
  }
  
  goToCheckout(): void {
    if (!this.currentCart || !this.currentCart.items || this.currentCart.items.length === 0) {
        this.snackBar.open('Sipariş oluşturmak için sepetinizde ürün bulunmalıdır.', 'Kapat', { duration: 3500 });
        return;
    }
    console.log('Navigating to checkout...');
    this.router.navigate(['/checkout']);
  }
}
