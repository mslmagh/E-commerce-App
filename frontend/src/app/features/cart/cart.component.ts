import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../core/services/cart.service';
import { Router, RouterLink } from '@angular/router';
// Checkbox'lar için FormsModule'e gerek yok, (change) event'i ile handle edeceğiz.
// import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink /*, FormsModule */], // FormsModule şimdilik gerekmiyor
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  selectedItems: Map<number | string, boolean> = new Map();
  isAllSelected: boolean = false;
  private cartSubscription?: Subscription;

  constructor(private cartService: CartService,private router :Router) { }

  ngOnInit(): void {
    console.log('CartComponent loaded');
    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      console.log('Cart items received in component:', items);
      this.cartItems = items;
      this.selectedItems.clear(); // Sepet güncellendiğinde eski seçimleri temizle
      this.updateSelectAllState(); // Tümünü seç durumunu güncelle
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe(); // Component yok olurken aboneliği bitir
    }
  }

  onItemSelectChange(item: CartItem, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isSelected = checkbox.checked;
    if (isSelected) {
      this.selectedItems.set(item.id, true);
    } else {
      this.selectedItems.delete(item.id);
    }
    // console.log('Selected items map:', this.selectedItems);
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    if (this.cartItems.length === 0) {
      this.isAllSelected = false;
      return;
    }
    this.isAllSelected = this.cartItems.every(item => this.selectedItems.get(item.id));
    // console.log('isAllSelected updated:', this.isAllSelected);
  }

  onSelectAllChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isSelected = checkbox.checked;
    this.isAllSelected = isSelected;
    this.cartItems.forEach(item => {
      if (isSelected) {
        this.selectedItems.set(item.id, true);
      } else {
        this.selectedItems.delete(item.id);
      }
    });
    // console.log('Selected items map after Select All:', this.selectedItems);
  }

  deleteSelectedItems(): void {
    const idsToDelete: (string | number)[] = [];
    this.selectedItems.forEach((isSelected, id) => {
      if (isSelected) {
        idsToDelete.push(id);
      }
    });

    if (idsToDelete.length > 0) {
      console.log('CartComponent: Deleting selected items with IDs:', idsToDelete);
      // if (confirm(`${idsToDelete.length} adet ürünü silmek istediğinize emin misiniz?`)) {
         this.cartService.removeSelectedItems(idsToDelete);
      // }
    } else {
      alert('Lütfen silmek için en az bir ürün seçin.');
    }
  }

  getSelectedItemsCount(): number {
     let count = 0;
     this.selectedItems.forEach(isSelected => {
         if (isSelected) {
             count++;
         }
     });
     return count;
  }

  calculateTotalPrice(): number { // Artık this.cartItems kullanıyor
    if (!this.cartItems || this.cartItems.length === 0) {
      return 0;
    }
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Adet artırma/azaltma/tekil silme metodları aynı kalır
  increaseQuantity(item: CartItem): void {
    this.cartService.addToCart(item);
  }

  decreaseQuantity(item: CartItem): void {
    this.cartService.decreaseQuantity(item.id);
  }

  removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item.id);
  }

  clearCart(): void {
     this.cartService.clearCart();
  }
  goToCheckout(): void {
    console.log('Navigating to checkout...');
    this.router.navigate(['/checkout']);
  }
}
