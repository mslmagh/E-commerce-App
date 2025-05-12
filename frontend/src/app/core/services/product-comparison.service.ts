import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from './product.service'; // Product arayüzünü import ediyoruz
import { MatSnackBar } from '@angular/material/snack-bar';

export const MAX_COMPARE_ITEMS = 4;

@Injectable({
  providedIn: 'root'
})
export class ProductComparisonService {
  private comparisonListSubject = new BehaviorSubject<number[]>([]); // Ürün ID'lerini tutacak
  public comparisonList$: Observable<number[]> = this.comparisonListSubject.asObservable();

  constructor(private snackBar: MatSnackBar) {
    // Servis ilk yüklendiğinde localStorage'dan listeyi yükleyebiliriz (opsiyonel)
    // this.loadListFromLocalStorage();
  }

  private saveListToLocalStorage(ids: number[]): void {
    // localStorage.setItem('comparisonList', JSON.stringify(ids));
  }

  private loadListFromLocalStorage(): void {
    // const storedList = localStorage.getItem('comparisonList');
    // if (storedList) {
    //   this.comparisonListSubject.next(JSON.parse(storedList));
    // }
  }

  getComparisonList(): number[] {
    return this.comparisonListSubject.getValue();
  }

  addToCompare(productId: number): void {
    const currentList = this.getComparisonList();
    if (currentList.includes(productId)) {
      this.snackBar.open('Bu ürün zaten karşılaştırma listenizde.', 'Kapat', { duration: 2000 });
      return;
    }

    if (currentList.length >= MAX_COMPARE_ITEMS) {
      this.snackBar.open(`En fazla ${MAX_COMPARE_ITEMS} ürün karşılaştırabilirsiniz.`, 'Kapat', { duration: 3000 });
      return;
    }

    const newList = [...currentList, productId];
    this.comparisonListSubject.next(newList);
    this.snackBar.open('Ürün karşılaştırma listesine eklendi.', 'Kapat', { duration: 2000 });
    // this.saveListToLocalStorage(newList); // Opsiyonel: LocalStorage'a kaydet
  }

  removeFromCompare(productId: number): void {
    const currentList = this.getComparisonList();
    const newList = currentList.filter(id => id !== productId);
    if (newList.length !== currentList.length) {
      this.comparisonListSubject.next(newList);
      this.snackBar.open('Ürün karşılaştırma listesinden çıkarıldı.', 'Kapat', { duration: 2000 });
      // this.saveListToLocalStorage(newList); // Opsiyonel: LocalStorage'a kaydet
    } else {
        // Bu durum normalde oluşmamalı, çünkü UI'da sadece listede olanlar için çıkarma butonu olmalı
        console.warn(`ProductComparisonService: Attempted to remove product ID ${productId} which is not in the list.`);
    }
  }

  isProductInCompareList(productId: number): boolean {
    return this.getComparisonList().includes(productId);
  }

  clearCompareList(): void {
    this.comparisonListSubject.next([]);
    this.snackBar.open('Karşılaştırma listesi temizlendi.', 'Kapat', { duration: 2000 });
    // this.saveListToLocalStorage([]); // Opsiyonel: LocalStorage'a kaydet
  }

  getCompareListCount(): Observable<number> {
    return new Observable<number>(observer => {
      this.comparisonList$.subscribe(list => {
        observer.next(list.length);
      });
    });
  }
} 