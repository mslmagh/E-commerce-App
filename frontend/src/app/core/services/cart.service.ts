// frontend/src/app/core/services/cart.service.ts
// YORUM SATIRSIZ HAL

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// import { HttpClient } from '@angular/common/http'; // Şimdilik gerekmiyor

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  cartItems$: Observable<CartItem[]> = this.cartItemsSource.asObservable();

  constructor() {
    // const savedCart = localStorage.getItem('shoppingCart');
    // if (savedCart) {
    //   this.cartItemsSource.next(JSON.parse(savedCart));
    // }
  }

  getCartItems(): CartItem[] {
    return this.cartItemsSource.getValue();
  }

  addToCart(product: any): void {
    const currentItems = this.getCartItems();
    const existingItemIndex = currentItems.findIndex(item => item.id === product.id);
    let updatedItems: CartItem[];

    if (existingItemIndex > -1) {
      console.log(`CartService: Updating quantity for product ${product.id}`);
      updatedItems = currentItems.map((item, index) => {
        if (index === existingItemIndex) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
    } else {
      console.log(`CartService: Adding new product ${product.id} to cart`);
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || undefined,
        quantity: 1
      };
      updatedItems = [...currentItems, newItem];
    }

    this.cartItemsSource.next(updatedItems);
    // localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
    console.log('Cart Updated:', this.getCartItems());
  }

  // İleride eklenecek diğer metodlar buraya gelebilir
  // removeFromCart(...) {}
  // clearCart() {}
  // getTotalPrice() {}
  // getTotalItemCount() {}
  // cart.service.ts sınıfının içine eklenecek yeni metodlar:

/**
 * Sepetteki bir ürünün adetini 1 azaltır. Adet 1 ise ürünü sepetten kaldırır.
 * @param productId Adeti azaltılacak ürünün ID'si
 */
decreaseQuantity(productId: number | string): void {
  const currentItems = this.getCartItems();
  const existingItem = currentItems.find(item => item.id === productId);

  if (!existingItem) {
    console.warn(`CartService: Product ID ${productId} not found for decreasing quantity.`);
    return;
  }

  if (existingItem.quantity > 1) {
    // Adet 1'den fazlaysa, sadece o ürünün adetini 1 azaltarak yeni bir dizi oluştur
    const updatedItems = currentItems.map(item =>
      item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
    );
    this.cartItemsSource.next(updatedItems); // Yeni listeyi yayınla
    // localStorage'ı da güncelle (eğer kullanıyorsak)
    // localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
    console.log(`CartService: Decreased quantity for product ${productId}`);
  } else {
    // Adet zaten 1 ise, ürünü tamamen kaldır (aşağıdaki metodu çağır)
    this.removeFromCart(productId);
  }
}

/**
 * Belirtilen ürünü sepetten tamamen kaldırır.
 * @param productId Sepetten kaldırılacak ürünün ID'si
 */
removeFromCart(productId: number | string): void {
  const currentItems = this.getCartItems();
  // Verilen ID'ye sahip olmayan tüm ürünleri filtreleyerek yeni bir dizi oluştur
  const updatedItems = currentItems.filter(item => item.id !== productId);

  // Liste gerçekten değiştiyse (ürün bulundu ve silindi ise) yeni listeyi yayınla
  if (updatedItems.length !== currentItems.length) {
     this.cartItemsSource.next(updatedItems);
     // localStorage'ı da güncelle (eğer kullanıyorsak)
     // localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
     console.log(`CartService: Removed product ${productId} from cart.`);
  } else {
     console.warn(`CartService: Product ID ${productId} not found for removal.`);
  }
}

/**
 * Sepeti tamamen boşaltır.
 */
clearCart(): void {
  this.cartItemsSource.next([]); // Boş dizi yayınla
  // localStorage.removeItem('shoppingCart'); // localStorage'ı temizle
  console.log('CartService: Cart cleared.');
}

/**
 * Verilen ID listesindeki ürünleri sepetten kaldırır.
 * @param itemIdsToRemove Kaldırılacak ürünlerin ID'lerini içeren dizi (number veya string olabilir).
 */
removeSelectedItems(itemIdsToRemove: (number | string)[]): void {

  if (!itemIdsToRemove || itemIdsToRemove.length === 0) {
    console.warn('CartService: No item IDs provided for removal.');
    return;
  }


  const currentItems = this.getCartItems();


  const updatedItems = currentItems.filter(item => !itemIdsToRemove.includes(item.id));


  if (updatedItems.length !== currentItems.length) {

     this.cartItemsSource.next(updatedItems);
     // Eğer localStorage kullanıyorsan burada da güncelle
     localStorage.setItem('shoppingCart', JSON.stringify(updatedItems));
     console.log(`CartService: Removed selected items. IDs:`, itemIdsToRemove);
  } else {
     // Silinmesi istenen ID'lerden hiçbiri sepette bulunamadıysa uyar
     console.warn(`CartService: None of the selected IDs found for removal:`, itemIdsToRemove);
  }
}
}
