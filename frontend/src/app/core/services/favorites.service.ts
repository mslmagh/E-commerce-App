import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product.service'; // Product interface'ini import et

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private platformId = inject(PLATFORM_ID);
  private favoritesItemsSource = new BehaviorSubject<Product[]>([]);
  public favorites$: Observable<Product[]> = this.favoritesItemsSource.asObservable();

  constructor() {
    this.loadFavoritesFromLocalStorage();
  }

  private loadFavoritesFromLocalStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedFavorites = localStorage.getItem('userFavorites');
      if (savedFavorites) {
        try {
          const parsedFavorites = JSON.parse(savedFavorites);
          this.favoritesItemsSource.next(parsedFavorites);
          console.log('FavoritesService: Loaded favorites from localStorage.');
        } catch (e) {
          console.error('FavoritesService: Error parsing favorites from localStorage', e);
          localStorage.removeItem('userFavorites'); // Bozuk veriyi temizle
        }
      }
    }
  }

  private saveFavoritesToLocalStorage(items: Product[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userFavorites', JSON.stringify(items));
      console.log('FavoritesService: Saved favorites to localStorage.');
    }
  }

  getFavoritesList(): Product[] {
    return this.favoritesItemsSource.getValue();
  }

  addFavorite(product: Product): void {
    const currentFavorites = this.getFavoritesList();
    if (!currentFavorites.some(item => item.id === product.id)) {
      const updatedFavorites = [...currentFavorites, product];
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites); // localStorage'a kaydet
      console.log(`FavoritesService: Added product ${product.id} to favorites.`);
    } else {
      console.log(`FavoritesService: Product ${product.id} already in favorites.`);
    }
  }

  removeFavorite(productId: number | string): void {
    const currentFavorites = this.getFavoritesList();
    const updatedFavorites = currentFavorites.filter(item => item.id !== productId);
    if (updatedFavorites.length !== currentFavorites.length) {
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites); // localStorage'dan sil
      console.log(`FavoritesService: Removed product ${productId} from favorites.`);
    } else {
      console.warn(`FavoritesService: Product ID ${productId} not found in favorites for removal.`);
    }
  }

  isFavorite(productId: number | string): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.some(item => item.id === productId))
    );
  }
}
