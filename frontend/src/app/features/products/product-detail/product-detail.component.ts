import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of, Subscription, take } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolunuzu kontrol edin
import { CartService } from '../../../core/services/cart.service'; // Yolunuzu kontrol edin
import { AuthService } from '../../../core/services/auth.service'; // Yolunuzu kontrol edin
import { FavoritesService } from '../../../core/services/favorites.service'; // Yolunuzu kontrol edin
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Angular Material Modülleri
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
// --- Eksik Material Modülleri Eklendi (Hataları çözecek) ---
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// ----------------------------------------

// Değerlendirme (Review) için temel interface
export interface ProductReview {
  id?: number | string;
  productId: number | string;
  userId: number | string; // Kimin yorum yaptığı (mock için string olabilir)
  userName: string; // Yorumu yapanın adı
  rating: number; // 1-5 arası puan
  comment: string; // Yorum metni
  date: Date; // Yorum tarihi
}


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
      CommonModule,
      RouterLink,
      MatSnackBarModule,
      MatButtonModule,
      MatIconModule,
      MatTabsModule,
      MatCardModule,
      MatFormFieldModule,
      MatInputModule,
      MatDividerModule,
      FormsModule,
      // --- Eksik Material Modülleri Imports'a Eklendi ---
      MatTooltipModule, // matTooltip hatası için
      MatProgressSpinnerModule, // mat-progress-spinner hatası için
      // -------------------------------------------------
    ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'] // CSS dosyasını kullanıyoruz
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product$: Observable<Product | undefined> = of(undefined);
  public activeTab: string = 'description';
  public isFavorite: boolean = false;
  // --- Yeni Eklenen Değişken (isLoading hatasını çözecek) ---
  isLoading: boolean = false; // Yükleme durumu için
  // -----------------------------
  private routeSubscription?: Subscription;
  private favoriteCheckSubscription?: Subscription;

  // --- Değerlendirme (Review) İçin Yeni Değişkenler ---
  reviews: ProductReview[] = [];
  newReviewRating: number = 0;
  newReviewComment: string = '';
  hoveredRating: number = 0;
  // ---------------------------------------------------

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router, // Router private kalabilir, getter ekleyeceğiz
    private authService: AuthService, // AuthService private kalabilir, getter ekleyeceğiz
    private favoritesService: FavoritesService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('ProductDetailComponent ngOnInit');
    // URL'deki ürün ID'sini al ve ürünü yükle
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('id');
        console.log('ProductDetailComponent: Found productId from route:', productId);
        this.isLoading = true; // Yüklemeyi başlat
        if (productId) {
          // Ürün bilgisini çek
          const productObservable = this.productService.getProductById(productId);
          // Ürün bilgisi geldiğinde favori durumunu ve yorumları kontrol et
          productObservable.subscribe(product => {
              if (product) {
                  this.checkIfFavorite(product.id); // Favori durumunu kontrol et
                  this.loadReviews(product.id); // Değerlendirmeleri çek
              } else {
                  console.error('Product not found for ID:', productId);
                   this.snackBar.open('Ürün bulunamadı!', 'Kapat', { duration: 3000 });
                   this.router.navigate(['/']); // Ürün bulunamazsa ana sayfaya dön
              }
               this.isLoading = false; // Yükleme bitti
          }, error => { // Hata durumunu yakala
               console.error('Error loading product:', error);
               this.isLoading = false; // Yükleme bitti (hata durumunda da)
                this.snackBar.open('Ürün yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
                this.router.navigate(['/']); // Hata olursa ana sayfaya dön
          });
           return productObservable; // switchMap'ten Observable'ı döndür
        } else {
          console.error('Product ID not found in route parameters!');
          this.isLoading = false; // Yükleme bitti
          this.snackBar.open('Ürün ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/']);
          return of(undefined); // Ürün bulunamadı durumu Observable'ı
        }
      })
    ).subscribe(product => {
        // Ana product$ Observable'ı güncellendiğinde çalışır
        this.product$ = of(product); // Componentteki product$ değişkenini güncelle
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
    // Eğer review'ler için ayrı bir abonelik olsaydı onu da iptal ederdik
  }

  checkIfFavorite(productId: string | number): void {
    if (this.favoriteCheckSubscription) {
      this.favoriteCheckSubscription.unsubscribe();
    }
     // Template'ten erişilebilen public getter'ı kullanacağız
     if (this.isLoggedIn) { // Kullanıcı giriş yapmışsa kontrol et
        this.favoriteCheckSubscription = this.favoritesService.isFavorite(productId).pipe(
          take(1) // Sadece ilk cevabı al, sonra abonelik otomatik bitsin
        ).subscribe(isFav => {
          this.isFavorite = isFav;
          console.log(`ProductDetailComponent: Product ${productId} is favorite?`, this.isFavorite);
        });
     } else {
        this.isFavorite = false; // Giriş yapmamışsa favori değildir
     }
  }

  addToCart(product: Product | undefined | null): void {
    if (product) {
      console.log(`${this.constructor.name}: Adding product to cart:`, product.name);
      this.cartService.addToCart(product);
      this.snackBar.open(`'${product.name}' sepete eklendi`, 'Tamam', {
        duration: 2500, horizontalPosition: 'center', verticalPosition: 'bottom'
      });
    } else {
      console.error(`${this.constructor.name}: Cannot add null/undefined product to cart.`);
      this.snackBar.open("Ürün sepete eklenemedi!", 'Kapat', { duration: 3000, panelClass: ['error-snackbar'] });
    }
  }

  selectTab(tabName: string): void {
    this.activeTab = tabName;
  }

  toggleFavorite(product: Product | undefined | null): void {
    if (!product) {
        this.snackBar.open("Favori işlemi yapılamadı.", "Kapat", { duration: 3000 });
        return;
    }
     // Template'ten erişilebilen public getter'ı kullanacağız
    if (this.isLoggedIn) { // Kullanıcı giriş yapmışsa işlem yap
      if (this.isFavorite) {
        this.favoritesService.removeFavorite(product.id);
        this.isFavorite = false;
        this.snackBar.open(`'${product.name}' favorilerden çıkarıldı.`, '', { duration: 2000 });
      } else {
        this.favoritesService.addFavorite(product);
        this.isFavorite = true;
        this.snackBar.open(`'${product.name}' favorilere eklendi!`, '', { duration: 2000 });
      }
    } else {
      const snackRef = this.snackBar.open('Favorilere eklemek için lütfen giriş yapın.', 'Giriş Yap', { duration: 4000 });
      snackRef.onAction().subscribe(() => {
        // Template'ten erişilebilen public getter'ı kullanacağız
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.currentUrl } });
      });
    }
  }

  // --- Değerlendirme (Review) Metotları ---

  loadReviews(productId: string | number): void {
      console.log(`Loading reviews for product ID: ${productId}`);
      // TODO: Gerçek uygulamada backend servisinden değerlendirmeleri çek
      // this.reviewService.getReviewsByProductId(productId).subscribe(reviews => { ... });

      // Mock değerlendirme verisi simülasyonu
      setTimeout(() => {
          this.reviews = [
              { id: 1, productId: productId, userId: 101, userName: 'Ali Veli', rating: 5, comment: 'Ürün harika, çok beğendim!', date: new Date(2025, 4, 5) },
              { id: 2, productId: productId, userId: 102, userName: 'Ayşe Yılmaz', rating: 4, comment: 'Beklediğim gibi çıktı, hızlı kargo.', date: new Date(2025, 4, 6) },
              // Ürün ID'sine göre farklı mock yorumlar döndürebilirsiniz
              ...(productId === 1 || productId === '1' ? [{ id: 3, productId: productId, userId: 103, userName: 'Mehmet Öztürk', rating: 5, comment: 'Kablosuz kulaklık müthiş!', date: new Date(2025, 4, 7) }] : []),
              ...(productId === 2 || productId === '2' ? [{ id: 4, productId: productId, userId: 104, userName: 'Fatma Kaya', rating: 4, comment: 'Akıllı saat işimi görüyor.', date: new Date(2025, 4, 7) }] : []),
          ];
          console.log('Mock reviews loaded:', this.reviews);
      }, 500);
  }

  selectRating(rating: number): void {
      this.newReviewRating = rating;
      this.hoveredRating = 0;
      console.log('Selected rating:', this.newReviewRating);
  }

  hoverRating(rating: number): void {
      this.hoveredRating = rating;
  }

  submitReview(): void {
      // Template'ten erişilebilen public getter'ı kullanacağız
      if (!this.isLoggedIn) {
          this.snackBar.open('Değerlendirme göndermek için lütfen giriş yapın.', 'Kapat', { duration: 3000 });
          return;
      }
       // Puan ve yorum metni zorunlu
      if (this.newReviewRating === 0 || !this.newReviewComment.trim()) {
           this.snackBar.open('Lütfen puan verin ve yorum yazın.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
           return;
      }

       let currentProductId: string | number | undefined;
       // product$ Observable'ının güncel değerini senkron olarak almak için take(1) ve subscribe kullanılır
       // product$ pipe'ı içindeki subscribe metodunu da kullanabiliriz, bu örnek daha basit
       this.product$.pipe(take(1)).subscribe(product => {
           currentProductId = product?.id;
       });


       if (!currentProductId) {
            this.snackBar.open('Ürün bilgisi alınamadı, yorum gönderilemiyor.', 'Kapat', { duration: 3000, panelClass: ['error-snackbar'] });
            console.error('Cannot submit review: Product ID is missing.');
            return;
       }

      const newReview: ProductReview = {
          productId: currentProductId,
          userId: 'mock-user-id-' + Math.floor(Math.random() * 1000),
          userName: 'Mevcut Kullanıcı',
          rating: this.newReviewRating,
          comment: this.newReviewComment.trim(),
          date: new Date()
      };

      console.log('Submitting new review (simulated):', newReview);
      // TODO: Backend servis çağrısı ile yorumu gönder
      // this.reviewService.submitReview(newReview).subscribe({
      //   next: (response) => { ... },
      //   error: (error) => { ... }
      // });

      // Başarılı gönderim simülasyonu
      setTimeout(() => {
          this.reviews = [newReview, ...this.reviews];
          this.snackBar.open('Değerlendirmeniz başarıyla gönderildi (simülasyon)!', 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
          // Formu temizle
          this.newReviewRating = 0;
          this.newReviewComment = '';
          this.hoveredRating = 0;
           console.log('New review added to mock list:', newReview);
      }, 1000);
  }

  // --- Private servis üyelerine template'ten erişim için Getter'lar (Hataları çözecek) ---
  get isLoggedIn(): boolean {
      return this.authService.isLoggedIn();
  }

  get currentUrl(): string {
      return this.router.url;
  }

  // productForm hatası için: review comment validasyonu productForm kullanmıyor,
  // sadece newReviewComment'ın boş olup olmadığını kontrol ediyor.
  // productForm özelliği bu componentte tanımlı DEĞİL ve gerekli de değil.
  // HTML'deki hata kontrolünü düzenledik.

  // ---------------------------------------

}
