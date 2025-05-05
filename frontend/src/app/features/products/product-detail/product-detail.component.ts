import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of, Subscription, take } from 'rxjs'; // Subscription, take eklendi
import { Product, ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service'; // Eklendi (YOLU KONTROL ET!)
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Snackbar eklendi
import { MatButtonModule } from '@angular/material/button'; // Snackbar aksiyonu için eklendi
import { MatIconModule } from '@angular/material/icon'; // Kalp ikonu için (HTML'de kullanılıyor)

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
      CommonModule,
      RouterLink,
      MatSnackBarModule, // Eklendi
      MatButtonModule,   // Eklendi
      MatIconModule      // Eklendi (mat-icon kullandığımız için)
    ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product$: Observable<Product | undefined> = of(undefined);
  public activeTab: string = 'description';
  public isFavorite: boolean = false;
  private routeSubscription?: Subscription; // Route params değişikliğini dinlemek için (opsiyonel)
  private favoriteCheckSubscription?: Subscription; // Favori kontrolü için

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
    private authService: AuthService,
    private favoritesService: FavoritesService, // Enjekte edildi
    private snackBar: MatSnackBar // Enjekte edildi
  ) { }

  ngOnInit(): void {
    // Route parametrelerini dinleyerek product bilgisini ve favori durumunu alalım
    // (snapshot yerine paramMap Observable'ını kullanmak daha iyi olabilir ama şimdilik snapshot ile)
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      console.log('ProductDetailComponent: Found productId from route:', productId);
      if (productId) {
        this.product$ = this.productService.getProductById(productId);
        this.checkIfFavorite(productId); // Ürün ID'si değişince favori durumunu kontrol et
      } else {
        console.error('Product ID not found in route parameters!');
        this.product$ = of(undefined); // Ürün bulunamadı durumu
      }
    });
  }

  ngOnDestroy(): void {
    // Component yok olurken oluşturduğumuz abonelikleri iptal et
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.favoriteCheckSubscription) {
      this.favoriteCheckSubscription.unsubscribe();
    }
  }

  checkIfFavorite(productId: string | number): void {
    // Önceki favori kontrol aboneliğini iptal et (varsa)
    if (this.favoriteCheckSubscription) {
      this.favoriteCheckSubscription.unsubscribe();
    }
    // Servisten gelen favori durumuna abone ol (ilk değeri almak için take(1))
    this.favoriteCheckSubscription = this.favoritesService.isFavorite(productId).pipe(
      take(1) // Sadece ilk cevabı al, sonra abonelik otomatik bitsin
    ).subscribe(isFav => {
      this.isFavorite = isFav;
      console.log(`ProductDetailComponent: Product ${productId} is favorite?`, this.isFavorite);
    });
  }

  addToCart(product: Product | undefined | null): void {
    if (product) {
       this.cartService.addToCart(product);
       // Sepete ekleme sonrası Snackbar ile bildirim verelim
       this.snackBar.open(`'${product.name}' sepete eklendi`, 'Kapat', { duration: 2500 });
       // this.router.navigate(['/cart']); // Yönlendirmeyi kaldırdık (isteğe bağlı)
    } else {
       console.error("ProductDetail: Cannot add null/undefined product to cart.");
       this.snackBar.open("Ürün sepete eklenemedi.", "Kapat", { duration: 3000 });
    }
  }

  selectTab(tabName: string): void {
    this.activeTab = tabName;
  }

  // Favori butonuna tıklanınca çalışacak GÜNCELLENMİŞ metod
  toggleFavorite(product: Product | undefined | null): void {
    if (!product) {
        this.snackBar.open("Favori işlemi yapılamadı.", "Kapat", { duration: 3000 });
        return;
    }

    if (this.authService.isLoggedIn()) {
      if (this.isFavorite) {
        // Favoriden çıkar
        this.favoritesService.removeFavorite(product.id);
        this.isFavorite = false; // İkonun anında değişmesi için state'i güncelle
        this.snackBar.open(`'${product.name}' favorilerden çıkarıldı.`, '', { duration: 2000 });
      } else {
        // Favoriye ekle
        this.favoritesService.addFavorite(product);
        this.isFavorite = true; // İkonun anında değişmesi için state'i güncelle
        this.snackBar.open(`'${product.name}' favorilere eklendi!`, '', { duration: 2000 });
      }
    } else {
      // Giriş yapmamışsa Snackbar ile uyar ve Login'e gitme aksiyonu ekle
      const snackRef = this.snackBar.open('Favorilere eklemek için lütfen giriş yapın.', 'Giriş Yap', { duration: 4000 });
      // Snackbar üzerindeki 'Giriş Yap' aksiyonuna tıklanırsa...
      snackRef.onAction().subscribe(() => {
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      });
    }
  }
}
