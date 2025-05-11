import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, Observable, map, firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart-item.model';
import { Cart } from '../../../core/models/cart.model';
import { OrderService, PaymentIntent as FrontendPaymentIntent } from '../../../core/services/order.service';
import { environment } from '../../../../environment';

import { loadStripe, Stripe, StripeCardElement, StripeElements, StripeError } from '@stripe/stripe-js';

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
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit, OnDestroy, AfterViewInit {
  selectedPaymentMethod: string = 'creditCard';
  isLoading: boolean = false;
  isStripeElementsLoading: boolean = true;

  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;
  orderId!: number;
  private subscriptions = new Subscription();

  @ViewChild('cardElement', { static: false, read: ElementRef }) cardElementRef!: ElementRef<HTMLDivElement>;
  stripe: Stripe | null = null;
  elements?: StripeElements;
  cardElement?: StripeCardElement;
  stripeError: string | null = null;

  private isStripeJsLoaded = false;
  private isViewInitialized = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cartService: CartService,
    private orderService: OrderService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.cartItems$ = this.cartService.cart$.pipe(map((cart: Cart | null) => cart?.items || []));
    this.cartTotal$ = this.cartService.cart$.pipe(map((cart: Cart | null) => cart?.grandTotal || 0));
  }

  ngOnInit(): void {
    this.isLoading = true;
    const routeSub = this.route.paramMap.subscribe(params => {
      const idParam = params.get('orderId');
      if (idParam) {
        this.orderId = +idParam;
        this.initializeStripe(); // Call and forget, ngAfterViewInit/onPaymentMethodChange will handle element prep
      } else {
        console.error('Order ID missing.');
        this.snackBar.open('Sipariş detayları eksik.', 'Kapat', { duration: 3000 });
        this.router.navigate(['/cart']);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(routeSub);

    const cartSub = this.cartItems$.subscribe(items => {
      if (!this.isLoading && items.length === 0 && this.orderId) {
        this.snackBar.open('Sepet boş.', 'Kapat', { duration: 3000 });
        this.router.navigate(['/products']);
      }
      if (this.isLoading && (this.orderId || items.length > 0)) {
        this.isLoading = false;
      }
    });
    this.subscriptions.add(cartSub);
  }

  async initializeStripe(): Promise<void> {
    if (this.isStripeJsLoaded) {
        console.log('[InitStripe] Stripe already loaded.');
        return; 
    }
    console.log('[InitStripe] Initializing Stripe...');
    // isStripeElementsLoading will be managed by prepareCardElement or mountStripeElement

    if (!environment.stripePublishableKey) {
      this.stripeError = 'Stripe anahtarı eksik.';
      this.isStripeJsLoaded = false;
      this.isStripeElementsLoading = false; // Ensure loading is false if key is missing
      this.cd.detectChanges();
      return;
    }

    try {
      // Load Stripe.js script
      this.stripe = await loadStripe(environment.stripePublishableKey);
      if (this.stripe) {
        // Initialize Elements
        this.elements = this.stripe.elements();
        this.isStripeJsLoaded = true;
        this.stripeError = null; // Clear any previous init errors
        console.log('[InitStripe] Stripe JS & Elements initialized successfully.');
      } else {
        throw new Error('Stripe.js yüklenemedi (loadStripe null döndü).');
      }
    } catch (error) {
      console.error('[InitStripe] Stripe initialization error:', error);
      this.stripeError = 'Ödeme sistemi başlatılamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata');
      this.isStripeJsLoaded = false;
      this.isStripeElementsLoading = false; // Ensure loading is false on error
    }
    this.cd.detectChanges(); // Reflect changes like stripeError or isStripeJsLoaded
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.cd.detectChanges(); 
    console.log('[View] View initialized. Selected Payment method:', this.selectedPaymentMethod);

    if (this.selectedPaymentMethod === 'creditCard') {
      console.log('[View] Credit card is selected. Attempting to prepare card element.');
      this.prepareCardElement().catch(err => {
          console.error('[View] Error during initial card element preparation in ngAfterViewInit:', err);
          // stripeError should be set by prepareCardElement or mountStripeElement
          // isStripeElementsLoading should also be managed there
          if (!this.stripeError) { // Set a generic error if not already set
            this.stripeError = (err instanceof Error) ? err.message : 'Kart formu ilk hazırlıkta başarısız oldu.';
          }
          this.isStripeElementsLoading = false;
          this.cd.detectChanges();
      });
    } else {
        this.isStripeElementsLoading = false; // Not credit card, so no Stripe elements loading
        this.cd.detectChanges();
    }
  }

  onPaymentMethodChange(value: string): void {
    console.log(`[Payment] Payment method changed to: ${value}`);
    this.selectedPaymentMethod = value; 
    this.stripeError = null; 
    // this.isStripeElementsLoading = false; // Reset loading state, prepareCardElement will set it if needed
    this.cd.detectChanges();

    this.destroyStripeElement(); // Always destroy first

    if (value === 'creditCard') {
      console.log('[Payment] Credit card selected. Preparing element.');
      // isStripeElementsLoading will be set to true at the beginning of prepareCardElement
      this.prepareCardElement().catch(err => {
        console.error('[Payment] Error preparing card element on method change:', err);
        // Error and loading state should be managed by prepareCardElement
        if (!this.stripeError) {
            this.stripeError = (err instanceof Error) ? err.message : 'Kart formu hazırlanamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
        }
        this.isStripeElementsLoading = false; // Ensure it's false on error here too
        this.cd.detectChanges();
      });
    } else {
      this.isStripeElementsLoading = false; // Not credit card, ensure spinner is off
      this.cd.detectChanges();
    }
  }

  mountStripeElement(): void {
    console.log('[Mount] Attempting to mount Stripe element');
    if(!this.isStripeElementsLoading) { // Ensure loading is true at the start
        this.isStripeElementsLoading = true;
        this.cd.detectChanges();
    }

    if (!this.isStripeJsLoaded) {
      console.warn('[Mount] StripeJS not loaded yet.');
      this.stripeError = 'Stripe altyapısı yüklenemedi.';
      this.isStripeElementsLoading = false; this.cd.detectChanges(); return;
    }
    if (!this.isViewInitialized) { 
      console.warn('[Mount] View not initialized yet.');
      this.stripeError = 'Sayfa henüz tam yüklenmedi.';
      this.isStripeElementsLoading = false; this.cd.detectChanges(); return;
    }
    if (!this.stripe || !this.elements) {
      console.error('[Mount] Stripe/Elements object missing.');
      this.stripeError = 'Stripe servisi yüklenemedi.';
      this.isStripeElementsLoading = false; this.cd.detectChanges(); return;
    }
    if (!this.cardElementRef?.nativeElement) {
      console.error('[Mount] cardElementRef missing, cannot mount.');
      this.stripeError = 'Kart formu alanı (cardElementRef) bulunamadı.';
      this.isStripeElementsLoading = false; this.cd.detectChanges(); return;
    }
    // Visibility check is now in waitForCardElementRef, but a final check can be useful
    if (this.cardElementRef.nativeElement.offsetParent === null) {
        console.warn('[Mount] cardElementRef is not visible (offsetParent is null) just before mount. This should have been caught by waitFor.');
        this.stripeError = "Kart formu alanı DOM'da var ama görünür değil.";
        this.isStripeElementsLoading = false; 
        this.cd.detectChanges();
        return;
    }

    if (this.cardElement) {
      console.log('[Mount] Destroying existing cardElement instance before remounting.');
      try {
        this.cardElement.unmount();
        this.cardElement.destroy();
      } catch (e) { console.warn('[Mount] Error cleaning up existing element:', e); }
      this.cardElement = undefined;
    }

    try {
      console.log('[Mount] Creating and mounting new Stripe Card Element.');
      this.cardElement = this.elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#32325d',
            '::placeholder': { color: '#aab7c4' },
          },
          invalid: { color: '#fa755a', iconColor: '#fa755a' },
        }
      });
      this.cardElement.mount(this.cardElementRef.nativeElement);
      this.cardElement.on('change', (event) => {
        this.ngZone.run(() => {
          this.stripeError = event.error ? event.error.message : null;
          this.cd.detectChanges();
        });
      });
      console.log('[Mount] Card element mounted successfully.');
      this.isStripeElementsLoading = false;
      this.stripeError = null;
      this.cd.detectChanges();
    } catch (error) {
      console.error('[Mount] Error during element mount:', error);
      this.stripeError = 'Kart formu yüklenemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.');
      this.isStripeElementsLoading = false;
      this.cd.detectChanges();
    }
  }

  destroyStripeElement(): void {
    if (this.cardElement) {
      console.log('[Destroy] Unmounting and destroying Stripe element.');
      this.cardElement.unmount();
      this.cardElement.destroy();
      this.cardElement = undefined;
    }
    this.isStripeElementsLoading = true; 
    this.stripeError = null;
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyStripeElement(); 
  }

  async proceedToPayment(): Promise<void> {
    if (!this.selectedPaymentMethod) {
      this.snackBar.open('Lütfen bir ödeme yöntemi seçin.', 'Kapat', { duration: 3000 });
      return;
    }

    // Kredi kartı dışındaki yöntemler için isLoading başta ayarlanabilir.
    if (this.selectedPaymentMethod !== 'creditCard') {
        this.isLoading = true;
    }
    this.stripeError = null;
    this.cd.detectChanges(); // Ensure UI reflects potential error clearing and initial isLoading for non-CC

    if (this.selectedPaymentMethod === 'creditCard') {
      // Kritik kontroller: isLoading true yapılmadan önce bu kontroller yapılmalı
      // çünkü isLoading=true formu gizleyebilir.
      if (!this.stripe || !this.elements || !this.orderId) {
        this.stripeError = 'Ödeme sistemi temel bilgileri hazır değil veya sipariş bilgisi eksik.';
        this.snackBar.open(this.stripeError, 'Kapat', { duration: 5000 });
        if (this.isLoading) { this.isLoading = false; } // Eğer ayarlandıysa geri al
        this.cd.detectChanges();
        return;
      }

      if (!this.cardElement) {
        console.error('[Payment] Stripe Card Element object (this.cardElement) is missing. It should have been prepared by now.');
        this.stripeError = 'Kart formu düzgün başlatılmamış. Lütfen ödeme yöntemini değiştirip tekrar kredi kartını seçin veya sayfayı yenileyin.';
        this.snackBar.open(this.stripeError, 'Kapat', { duration: 7000 });
        if (this.isLoading) { this.isLoading = false; } // Eğer ayarlandıysa geri al
        this.cd.detectChanges();
        return;
      }
      
      // Kart elementi nesnesi var, şimdi isLoading=true yapıp ödeme işlemine devam edebiliriz.
      this.isLoading = true;
      this.cd.detectChanges(); // Bu, *ngIf="!isLoading" nedeniyle formu gizleyecektir.

      try {
        console.log('[Payment] Creating payment intent for order:', this.orderId);
        const paymentIntentDto = await firstValueFrom(this.orderService.createPaymentIntent(this.orderId));
        
        if (!paymentIntentDto?.clientSecret) {
          throw new Error('Client secret alınamadı.');
        }
        
        console.log('[Payment] Payment intent created successfully with client secret.');
        this.snackBar.open('Ödemeniz işleniyor...', undefined, { duration: 0 });

        // Stripe confirmCardPayment öncesi detaylı loglar
        if (this.cardElement) {
            console.log('[Payment] Pre-confirm: Card Element object exists.');
            // @ts-ignore
            if (this.cardElement._invalid) {
                 // @ts-ignore
                console.warn('[Payment] Pre-confirm: Card Element is internally marked as invalid. Error:', this.cardElement._lastError);
            }
            // @ts-ignore
            if (this.cardElement._empty) {
                console.warn('[Payment] Pre-confirm: Card Element is internally marked as empty.');
            }
            // @ts-ignore
            if (this.cardElement._complete === false) {
                console.warn('[Payment] Pre-confirm: Card Element is internally marked as not complete.');
            }
            // Check if the underlying DOM element for cardElementRef is still there and visible
            if (this.cardElementRef?.nativeElement) {
                console.log('[Payment] Pre-confirm: cardElementRef.nativeElement exists.');
                if (this.cardElementRef.nativeElement.offsetParent === null) {
                    console.warn('[Payment] Pre-confirm: cardElementRef.nativeElement is NOT visible (offsetParent is null). This is likely the issue!');
                }
            } else {
                console.warn('[Payment] Pre-confirm: cardElementRef.nativeElement does NOT exist.');
            }
        } else {
            // Bu durum zaten metodun başında yakalanmıştı ama yine de loglayalım.
            console.error('[Payment] Pre-confirm: CRITICAL - this.cardElement is NULL before confirmCardPayment!');
        }
        
        console.log('[Payment] Attempting to confirm card payment with Stripe API...');
        const result = await this.stripe.confirmCardPayment(paymentIntentDto.clientSecret, {
          payment_method: {
            card: this.cardElement, // Bu this.cardElement nesnesi kullanılacak
          }
        });

        this.snackBar.dismiss(); // "Ödemeniz işleniyor..." snackbarını kapat

        if (result.error) {
          console.error('[Payment] Stripe Error:', result.error);
          throw new Error(result.error.message || 'Bilinmeyen bir Stripe ödeme hatası.');
        } 
        
        if (result.paymentIntent?.status === 'succeeded') {
          console.log('[Payment] Payment Succeeded:', result.paymentIntent);
          this.snackBar.open('Ödeme başarıyla tamamlandı!', 'Harika!', { duration: 5000 });
          this.cartService.clearCart().subscribe(); 
          this.router.navigate(['/profile/orders']);
        } else {
          throw new Error(`Ödeme durumu beklenmiyor: ${result.paymentIntent?.status || 'bilinmiyor'}`);
        }
      } catch (err) {
        this.snackBar.dismiss(); // Hata durumunda da snackbarı kapat
        console.error('[Payment] Error in payment process:', err);
        let errorMessage = 'Ödeme işlemi sırasında bir hata oluştu.';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        this.stripeError = errorMessage;
        this.snackBar.open(errorMessage, 'Kapat', { duration: 7000 });
      } finally {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    } else if (this.selectedPaymentMethod === 'cod') {
      // Kapıda ödeme mantığı (isLoading zaten true yapılmıştı)
      this.snackBar.open('Kapıda ödeme ile siparişiniz alınıyor...', undefined, { duration: 2000 });
      setTimeout(() => {
        this.cartService.clearCart().subscribe();
        this.snackBar.open('Kapıda ödeme siparişiniz başarıyla alındı!', 'Harika!', { duration: 7000 });
        this.router.navigate(['/profile/orders']); 
        this.isLoading = false; 
        this.cd.detectChanges();
      }, 1500);
    } else {
      // Diğer veya geçersiz ödeme yöntemleri
      this.snackBar.open('Geçersiz ödeme yöntemi seçildi.', 'Kapat', { duration: 3000 });
      if (this.isLoading) { // Eğer non-CC path için true ayarlandıysa
          this.isLoading = false;
          this.cd.detectChanges();
      }
    }
  }

  private async prepareCardElement(): Promise<void> {
    console.log('[Prepare] Preparing card element...');
    this.isStripeElementsLoading = true;
    this.cd.detectChanges();

    if (!this.isStripeJsLoaded) {
      console.log('[Prepare] Stripe.js not loaded, attempting to initialize...');
      await this.initializeStripe(); 
      if (!this.isStripeJsLoaded) {
        this.isStripeElementsLoading = false;
        this.cd.detectChanges();
        throw new Error('Stripe.js başlatılamadı, kart formu hazırlanamıyor.');
      }
    }

    if (!this.stripe || !this.elements) {
      this.isStripeElementsLoading = false;
      this.cd.detectChanges();
      throw new Error('Stripe veya Elements objesi eksik, kart formu hazırlanamıyor.');
    }

    try {
      await this.waitForCardElementRef();
      this.mountStripeElement(); 
      // mountStripeElement will set isStripeElementsLoading to false on success/failure
    } catch (error) {
      console.error('[Prepare] Error waiting for or mounting card element:', error);
      this.stripeError = (error instanceof Error) ? error.message : 'Kart formu alanı yüklenemedi veya monte edilemedi.';
      this.isStripeElementsLoading = false;
      this.cd.detectChanges();
      throw error; 
    }
  }

  private waitForCardElementRef(maxAttempts = 10, delay = 100): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        if (this.cardElementRef?.nativeElement && this.cardElementRef.nativeElement.offsetParent !== null) {
          console.log('[Prepare] cardElementRef is available and visible.');
          resolve();
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error('[Prepare] cardElementRef did not become available/visible after maximum attempts.');
            reject(new Error('Kart formu alanı görünür hale gelmedi.'));
          } else {
            console.log(`[Prepare] cardElementRef not available/visible, attempt ${attempts}/${maxAttempts}. Retrying in ${delay}ms...`);
            setTimeout(check, delay);
          }
        }
      };
      check();
    });
  }
}
