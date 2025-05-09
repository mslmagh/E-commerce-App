import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface ReviewRequest {
  rating: number;
  comment: string;
}

export interface ReviewPage {
  content: Review[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  getProductReviews(productId: number, page: number = 0, size: number = 5): Observable<ReviewPage> {
    console.log(`ReviewService: Fetching reviews for product ID: ${productId}`);
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'reviewDate,desc');

    return this.http.get<ReviewPage>(`${this.apiUrl}/${productId}/reviews`, { params }).pipe(
      tap(response => console.log(`ReviewService: Fetched ${response.content.length} reviews for product ID ${productId}`)),
      catchError(this.handleError<ReviewPage>('getProductReviews'))
    );
  }

  createReview(productId: number, reviewData: ReviewRequest): Observable<Review> {
    console.log(`ReviewService: Creating review for product ID: ${productId}`, reviewData);
    
    return this.http.post<Review>(`${this.apiUrl}/${productId}/reviews`, reviewData).pipe(
      tap(review => console.log(`ReviewService: Created review with ID: ${review.id}`)),
      catchError(this.handleError<Review>('createReview'))
    );
  }

  updateReview(reviewId: number, reviewData: ReviewRequest): Observable<Review> {
    console.log(`ReviewService: Updating review ID: ${reviewId}`, reviewData);
    
    return this.http.put<Review>(`${environment.apiUrl}/reviews/${reviewId}`, reviewData).pipe(
      tap(_ => console.log(`ReviewService: Updated review ID: ${reviewId}`)),
      catchError(this.handleError<Review>('updateReview'))
    );
  }

  deleteReview(reviewId: number): Observable<void> {
    console.log(`ReviewService: Deleting review ID: ${reviewId}`);
    
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${reviewId}`).pipe(
      tap(_ => console.log(`ReviewService: Deleted review ID: ${reviewId}`)),
      catchError(this.handleError<void>('deleteReview'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      let errorMessage = `${operation} failed: ${error.message}`;
      if (error.error && typeof error.error.message === 'string') {
        errorMessage = error.error.message;
      }
      
      // Let the app keep running by returning a safe result
      return throwError(() => new Error(errorMessage));
    };
  }
} 