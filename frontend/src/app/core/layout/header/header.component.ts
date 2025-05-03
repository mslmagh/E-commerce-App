// frontend/src/app/core/layout/header/header.component.ts
// SON HAL (Dinamik İçerik, Logout ve Sepet Sayacı Mantığı)

import { Component, OnInit, OnDestroy } from '@angular/core'; // OnInit ve OnDestroy eklendi
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Router eklendi
import { FormsModule } from '@angular/forms'; // Arama çubuğu için vardı
import { Subscription } from 'rxjs'; // Subscription eklendi
import { map } from 'rxjs/operators'; // map operatörü eklendi
import { AuthService } from '../../../core/services/auth.service'; // AuthService yolu kontrol et
import { CartService, CartItem } from '../../../core/services/cart.service'; // CartService ve CartItem yolu kontrol et

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] // veya .scss
})
export class HeaderComponent implements OnInit, OnDestroy {

  searchTerm: string = '';
  isUserLoggedIn: boolean = false; // Giriş durumu (başlangıçta false)
  cartItemCount: number = 0; // Sepet sayısı (başlangıçta 0)
  private authSubscription?: Subscription; // Auth durumu için ileride kullanılabilir
  private cartSubscription?: Subscription; // Sepet aboneliğini tutmak için

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router // Yönlendirme için Router'ı enjekte et
  ) { }

  ngOnInit(): void {
    // Component yüklendiğinde giriş durumunu kontrol et
    this.isUserLoggedIn = this.authService.isLoggedIn();
    console.log('HeaderComponent ngOnInit - isLoggedIn:', this.isUserLoggedIn);

    // Sepetteki toplam ürün sayısını almak için abone ol
    this.cartSubscription = this.cartService.cartItems$.pipe(
      map((items: CartItem[]) => {
        // Her ürünün quantity'sini topla
        return items.reduce((count, item) => count + item.quantity, 0);
      })
    ).subscribe(count => {
      this.cartItemCount = count;
      console.log('HeaderComponent: Cart count updated to', this.cartItemCount);
    });

    // NOT: İdeal bir dünyada, AuthService'in login durumu değiştiğinde
    // (örneğin bir BehaviorSubject aracılığıyla) yayın yapması ve
    // bu component'in ona abone olup isUserLoggedIn'i güncellemesi gerekir.
    // Şimdilik sadece başlangıçta ve logout'ta manuel güncelliyoruz.
  }

  ngOnDestroy(): void {
    // Component kaldırıldığında abonelikleri sonlandır (memory leak önler)
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  performSearch(): void {
    console.log('Arama yapılıyor:', this.searchTerm);
    // TODO: Arama işlemi
  }

  // Çıkış yapma metodu
  logout(): void {
    console.log('HeaderComponent: Logging out...');
    this.authService.logout(); // Token'ı sil
    this.isUserLoggedIn = false; // Durumu manuel güncelle
    this.router.navigate(['/auth/login']); // Login sayfasına yönlendir
  }
}
