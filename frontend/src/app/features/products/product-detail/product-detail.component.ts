import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of, Subscription, take } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolunuzu kontrol edin
import { CartService } from '../../../core/services/cart.service'; // Yolunuzu kontrol edin
import { AuthService } from '../../../core/services/auth.service'; // Yolunuzu kontrol edin
import { FavoritesService } from '../../../core/services/favorites.service'; // Yolunuzu kontrol edin
import { Review, ReviewRequest, ReviewService } from '../../../core/services/review.service'; // Yeni eklenen
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
      MatTooltipModule, // matTooltip hatası için
      MatProgressSpinnerModule, // mat-progress-spinner hatası için
    ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'] // CSS dosyasını kullanıyoruz
})
export class ProductDetailComponent implements OnInit, OnDestroy {

  product$: Observable<Product | undefined> = of(undefined);
  public activeTab: string = 'description';
  public isFavorite: boolean = false;
  isLoading: boolean = false; // Yükleme durumu için
  private routeSubscription?: Subscription;
  private favoriteCheckSubscription?: Subscription;

  reviews: Review[] = [];
  newReviewRating: number = 0;
  newReviewComment: string = '';
  hoveredRating: number = 0;
  loadingReviews: boolean = false;
  reviewPage: number = 0;
  reviewsPerPage: number = 5;
  totalReviews: number = 0;
  totalReviewPages: number = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private router: Router, // Router private kalabilir, getter ekleyeceğiz
    private authService: AuthService, // AuthService private kalabilir, getter ekleyeceğiz
    private favoritesService: FavoritesService,
    private reviewService: ReviewService, // Yeni eklenen
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('ProductDetailComponent ngOnInit');
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const productId = params.get('id');
        console.log('ProductDetailComponent: Found productId from route:', productId);
        this.isLoading = true; // Yüklemeyi başlat
        if (productId) {
          const productObservable = this.productService.getProductById(productId);
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
        this.product$ = of(product); // Componentteki product$ değişkenini güncelle
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.favoriteCheckSubscription) {
      this.favoriteCheckSubscription.unsubscribe();
    }
  }

  checkIfFavorite(productId: number): void {
    if (this.favoriteCheckSubscription) {
      this.favoriteCheckSubscription.unsubscribe();
    }
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
        this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.currentUrl } });
      });
    }
  }

  loadReviews(productId: number): void {
    console.log(`Loading reviews for product ID: ${productId}`);
    this.loadingReviews = true;

    this.reviewService.getProductReviews(productId, this.reviewPage, this.reviewsPerPage).subscribe(
      response => {
        this.reviews = response.content;
        this.totalReviews = response.totalElements;
        this.totalReviewPages = response.totalPages;
        this.loadingReviews = false;
        console.log(`Loaded ${response.content.length} reviews for product ID: ${productId}`);
      },
      error => {
        console.error('Error loading reviews:', error);
        this.loadingReviews = false;
        this.snackBar.open('Değerlendirmeler yüklenirken bir hata oluştu', 'Kapat', { duration: 3000 });
      }
    );
  }

  loadNextReviewPage(): void {
    if (this.reviewPage < this.totalReviewPages - 1) {
      this.reviewPage++;
      let currentProductId: number | undefined;
      this.product$.pipe(take(1)).subscribe(product => {
        currentProductId = product?.id;
        if (currentProductId) {
          this.loadReviews(currentProductId);
        }
      });
    }
  }

  loadPreviousReviewPage(): void {
    if (this.reviewPage > 0) {
      this.reviewPage--;
      let currentProductId: number | undefined;
      this.product$.pipe(take(1)).subscribe(product => {
        currentProductId = product?.id;
        if (currentProductId) {
          this.loadReviews(currentProductId);
        }
      });
    }
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
      if (!this.isLoggedIn) {
          this.snackBar.open('Değerlendirme göndermek için lütfen giriş yapın.', 'Kapat', { duration: 3000 });
          return;
      }
      if (this.newReviewRating === 0 || !this.newReviewComment.trim()) {
           this.snackBar.open('Lütfen puan verin ve yorum yazın.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
           return;
      }

       let currentProductId: number | undefined;
       this.product$.pipe(take(1)).subscribe(product => {
           currentProductId = product?.id;
       });

       if (!currentProductId) {
            this.snackBar.open('Ürün bilgisi alınamadı, yorum gönderilemiyor.', 'Kapat', { duration: 3000, panelClass: ['error-snackbar'] });
            console.error('Cannot submit review: Product ID is missing.');
            return;
       }

      const reviewRequest: ReviewRequest = {
          rating: this.newReviewRating,
          comment: this.newReviewComment.trim()
      };

      console.log('Submitting new review:', reviewRequest);

      this.reviewService.createReview(currentProductId, reviewRequest).subscribe(
        newReview => {
          // Refresh reviews to show the new review
          this.loadReviews(currentProductId!);
          this.snackBar.open('Değerlendirmeniz başarıyla gönderildi!', 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
          this.newReviewRating = 0;
          this.newReviewComment = '';
          this.hoveredRating = 0;
        },
        error => {
          console.error('Error submitting review:', error);
          this.snackBar.open('Değerlendirme gönderilirken bir hata oluştu', 'Kapat', { duration: 3000, panelClass: ['error-snackbar'] });
        }
      );
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUsername(): string | null {
    return this.authService.getUsername();
  }

  get currentUrl(): string {
    return this.router.url;
  }
}
