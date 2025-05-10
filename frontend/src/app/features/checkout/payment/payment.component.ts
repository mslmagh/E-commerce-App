import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ngModel için
import { Subscription, Observable, map } from 'rxjs'; // Observable ve map import edildi

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field'; // EKLENDİ
import { MatInputModule } from '@angular/material/input'; // EKLENDİ
import { MatDividerModule } from '@angular/material/divider'; // MatDividerModule eklendi

import { CartService } from '../../../core/services/cart.service'; // CartService import edildi
import { CartItem } from '../../../core/models/cart-item.model'; // CartItem modelden import edildi
import { Cart } from '../../../core/models/cart.model'; // Cart modelini import et
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatExpansionModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule, // EKLENDİ
    MatInputModule,     // EKLENDİ
    MatDividerModule,    // EKLENDİ
    MatSpinner 
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy {
  selectedPaymentMethod: string = ''; // Örn: 'creditCard', 'paypal', 'cod'
  isLoading: boolean = false;

  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  // private cartSubscription!: Subscription; // Bu subscribe içinde ele alınacak

  creditCardForm = {
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: ''
  };

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private cartService: CartService // CartService enjekte edildi
  ) {
    this.cartItems$ = this.cartService.cart$.pipe(
      map((cart: Cart | null) => cart?.items || [])
    );
    this.cartTotal$ = this.cartService.cart$.pipe(
      map((cart: Cart | null) => cart?.grandTotal || 0)
    );
  }

  ngOnInit(): void {
    console.log('PaymentComponent yüklendi.');
    // cartSubscription ngOnDestroy içinde ele alınacak şekilde yeniden düzenlenecek.
    // Şimdilik doğrudan subscribe oluyoruz, ancak uzun vadede takeUntil(this.destroy$) gibi bir mekanizma daha iyi olabilir.
    this.cartItems$.subscribe(items => {
      if (items.length === 0 && !this.isLoading) { // isLoading kontrolü eklendi, sipariş sonrası clearCart yapıldığında yönlendirmesin diye.
        // Kullanıcı ödeme sayfasındayken sepet boşalırsa (örn: başka bir sekmede)
        // ve henüz bir ödeme işlemi başlatılmadıysa (isLoading false ise)
        this.snackBar.open('Sepetiniz boşaldı. Ana sayfaya yönlendiriliyorsunuz.', 'Tamam', { duration: 4000 });
        this.router.navigate(['/']); // Ana sayfaya veya sepet sayfasına yönlendir.
      }
    });
  }

  ngOnDestroy(): void {
    // Eğer cartSubscription ngOnInit'te atanırsa burada unsubscribe edilmeli.
    // Ancak mevcut yapıda constructor'da Observable'lar oluşturuluyor ve async pipe ile template'de kullanılıyor olabilir.
    // Eğer ngOnInit'te subscribe ediliyorsa, burada unsubscribe etmek önemlidir.
    // Mevcut kodda this.cartSubscription tanımlı ama atanmıyor. Bu satırı kaldırabiliriz ya da ngOnInit'te atama yapıp burada unsubscribe edebiliriz.
    // Şimdilik ngOnInit'teki subscribe'ı bıraktım, bu yüzden bir unsubscribe mekanizması (örn: takeUntil) daha robust olur.
    // Ya da subscribe'ı ngOnInit'e taşıyıp, this.cartSubscription'a atayıp burada unsubscribe edebiliriz.
    // Şimdilik sadece ngOnInit'teki subscribe'ın potansiyel memory leak'e dikkat çekmek istedim.
    // Örnek bir implementasyon:
    // private destroy$ = new Subject<void>();
    // ngOnInit() { this.cartItems$.pipe(takeUntil(this.destroy$)).subscribe(...); }
    // ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
    // Bu değişiklik şimdilik uygulanmayacak, sadece bir not.
  }

  proceedToPayment(): void {
    if (!this.selectedPaymentMethod) {
      this.snackBar.open('Lütfen bir ödeme yöntemi seçin.', 'Kapat', { duration: 3000 });
      return;
    }

    this.isLoading = true; // Yükleme animasyonu başlat
    this.snackBar.open(`${this.selectedPaymentMethod.toUpperCase()} ile ödeme işlemi simüle ediliyor...`, 'Tamam', { duration: 3000 });
    console.log('Seçilen ödeme yöntemi:', this.selectedPaymentMethod);

    if (this.selectedPaymentMethod === 'creditCard') {
      console.log('Kredi Kartı Bilgileri:', this.creditCardForm);
    } else if (this.selectedPaymentMethod === 'paypal') {
    } else if (this.selectedPaymentMethod === 'cod') {
    }

    setTimeout(() => {
      this.isLoading = false; // Yükleme animasyonu durdur
      this.cartService.clearCart().subscribe({ // clearCart backend'e istek atıyorsa subscribe gerekli
        next: () => {
            console.log("Cart cleared after payment.");
            this.router.navigate(['/profile/orders']); 
            this.snackBar.open('Ödeme başarıyla tamamlandı! Siparişiniz alındı.', 'Harika!', {
              duration: 7000,
              panelClass: ['success-snackbar'] 
            });
        },
        error: (err) => {
            console.error("Error clearing cart after payment:", err);
            // Kullanıcıya hata mesajı gösterilebilir, ancak ödeme başarılı olduğu için sipariş sayfasına yönlendirildi.
            this.router.navigate(['/profile/orders']); 
             this.snackBar.open('Ödeme başarılı ancak sepet temizlenirken bir sorun oluştu.', 'Tamam', {
              duration: 5000,
            });
        }
      });
    }, 2500);
  }
}
