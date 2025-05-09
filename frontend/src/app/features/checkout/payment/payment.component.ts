import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ngModel için
import { Subscription, Observable, map } from 'rxjs'; // Observable ve map import edildi

// Angular Material Modülleri
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field'; // EKLENDİ
import { MatInputModule } from '@angular/material/input'; // EKLENDİ
import { MatDividerModule } from '@angular/material/divider'; // MatDividerModule eklendi

// Servisler
import { CartService, CartItem } from '../../../core/services/cart.service'; // CartService import edildi
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

  // Sipariş Özeti için
  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  private cartSubscription!: Subscription;

  // Kredi Kartı Formu için (ngModel ile bağlanacak)
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
    this.cartItems$ = this.cartService.cartItems$;
    this.cartTotal$ = this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + (item.price * item.quantity), 0))
    );
  }

  ngOnInit(): void {
    console.log('PaymentComponent yüklendi.');
    // Sepet boşsa kullanıcıyı bilgilendirip belki sepet sayfasına yönlendirebiliriz.
    this.cartSubscription = this.cartItems$.subscribe(items => {
      if (items.length === 0) {
        this.snackBar.open('Sepetiniz boş. Ödeme yapamazsınız.', 'Sepete Git', { duration: 5000 })
          .onAction().subscribe(() => {
            this.router.navigate(['/cart']);
          });
        this.router.navigate(['/cart']); // Otomatik yönlendirme
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
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
      // TODO: Kredi kartı bilgilerini doğrula ve backend'e gönder (Stripe/PayPal SDK entegrasyonu).
      // Örneğin: this.paymentService.processStripePayment(this.creditCardForm, await this.cartTotal$.toPromise());
    } else if (this.selectedPaymentMethod === 'paypal') {
      // TODO: PayPal ödeme akışını başlat.
      // Örneğin: this.paymentService.initiatePayPalPayment(await this.cartTotal$.toPromise());
    } else if (this.selectedPaymentMethod === 'cod') {
      // Kapıda ödeme için siparişi direkt oluştur.
      // Örneğin: this.orderService.createOrder({ paymentMethod: 'cod', address: ..., items: ... });
    }

    // Simülasyon: Başarılı ödeme sonrası
    setTimeout(() => {
      this.isLoading = false; // Yükleme animasyonu durdur
      this.cartService.clearCart(); // Sepeti temizle (CartService üzerinden)
      this.router.navigate(['/profile/orders']); // Ya da özel bir sipariş onay sayfasına (/order-confirmation)
      this.snackBar.open('Ödeme başarıyla tamamlandı! Siparişiniz alındı.', 'Harika!', {
        duration: 7000,
        panelClass: ['success-snackbar'] // Başarı mesajı için özel stil (styles.css'e eklenebilir)
      });
    }, 2500);
  }
}
