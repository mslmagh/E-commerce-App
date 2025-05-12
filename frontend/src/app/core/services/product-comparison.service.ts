import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Product } from './product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { catchError, tap, map } from 'rxjs/operators';

export const MAX_COMPARE_ITEMS = 4;

@Injectable({
  providedIn: 'root'
})
export class ProductComparisonService {
  private comparisonListSubject = new BehaviorSubject<Product[]>([]);
  public comparisonList$ = this.comparisonListSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/compare`;
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.refreshComparisonList();
  }

  refreshComparisonList(): void {
    this.http.get<Product[]>(this.apiUrl).pipe(
      tap(list => this.comparisonListSubject.next(list)),
      catchError(err => {
        this.comparisonListSubject.next([]);
        this.snackBar.open('Karşılaştırma listesi yüklenemedi.', 'Kapat', { duration: 2000 });
        return of([]);
      })
    ).subscribe();
  }

  addToCompare(productId: number): void {
    if (this.getComparisonList().find(p => p.id === productId)) {
      this.snackBar.open('Bu ürün zaten karşılaştırma listenizde.', 'Kapat', { duration: 2000 });
      return;
    }
    if (this.getComparisonList().length >= MAX_COMPARE_ITEMS) {
      this.snackBar.open(`En fazla ${MAX_COMPARE_ITEMS} ürün karşılaştırabilirsiniz.`, 'Kapat', { duration: 3000 });
      return;
    }
    this.http.post(`${this.apiUrl}/${productId}`, {}).pipe(
      tap(() => {
        this.snackBar.open('Ürün karşılaştırma listesine eklendi.', 'Kapat', { duration: 2000 });
        this.refreshComparisonList();
      }),
      catchError(err => {
        this.snackBar.open('Ürün eklenirken hata oluştu.', 'Kapat', { duration: 2000 });
        return of(null);
      })
    ).subscribe();
  }

  removeFromCompare(productId: number): void {
    this.http.delete(`${this.apiUrl}/${productId}`).pipe(
      tap(() => {
        this.snackBar.open('Ürün karşılaştırma listesinden çıkarıldı.', 'Kapat', { duration: 2000 });
        this.refreshComparisonList();
      }),
      catchError(err => {
        this.snackBar.open('Ürün çıkarılırken hata oluştu.', 'Kapat', { duration: 2000 });
        return of(null);
      })
    ).subscribe();
  }

  clearCompareList(): void {
    this.http.delete(this.apiUrl).pipe(
      tap(() => {
        this.snackBar.open('Karşılaştırma listesi temizlendi.', 'Kapat', { duration: 2000 });
        this.refreshComparisonList();
      }),
      catchError(err => {
        this.snackBar.open('Liste temizlenirken hata oluştu.', 'Kapat', { duration: 2000 });
        return of(null);
      })
    ).subscribe();
  }

  getComparisonList(): Product[] {
    return this.comparisonListSubject.getValue();
  }

  isProductInCompareList(productId: number): boolean {
    return this.getComparisonList().some(p => p.id === productId);
  }

  getCompareListCount(): Observable<number> {
    return this.comparisonList$.pipe(
      map(list => list.length)
    );
  }
} 