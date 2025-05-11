import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ReviewService, UserReview, UserReviewPage } from '../../../core/services/review.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit, OnDestroy {
  reviews: UserReview[] = [];
  isLoading: boolean = false;
  currentPage: number = 0;
  pageSize: number = 10; // Backend ile uyumlu veya istenen değer
  totalReviews: number = 0;
  totalPages: number = 0;

  private reviewsSubscription?: Subscription;

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadUserReviews();
    } else {
      // Kullanıcı giriş yapmamışsa bir mesaj gösterilebilir veya login'e yönlendirilebilir.
      this.snackBar.open('Yorumlarınızı görmek için lütfen giriş yapın.', 'Kapat', { duration: 3000 });
      // Opsiyonel: this.router.navigate(['/auth/login']);
    }
  }

  loadUserReviews(page: number = 0): void {
    this.isLoading = true;
    this.currentPage = page;
    this.reviewsSubscription = this.reviewService.getMyReviews(this.currentPage, this.pageSize).subscribe({
      next: (reviewPage: UserReviewPage) => {
        this.reviews = reviewPage.content;
        this.totalReviews = reviewPage.totalElements;
        this.totalPages = reviewPage.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user reviews:', err);
        this.isLoading = false;
        this.snackBar.open(err.message || 'Yorumlar yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.reviewsSubscription?.unsubscribe();
  }

  // Sayfalama metotları
  loadNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.loadUserReviews(this.currentPage + 1);
    }
  }

  loadPreviousPage(): void {
    if (this.currentPage > 0) {
      this.loadUserReviews(this.currentPage - 1);
    }
  }

  // TODO: İsteğe bağlı olarak yorum düzenleme/silme için ürün detayına yönlendirme veya modal açma metotları
  // editReview(review: UserReview): void { ... }
  // deleteReview(review: UserReview): void { ... }
}
