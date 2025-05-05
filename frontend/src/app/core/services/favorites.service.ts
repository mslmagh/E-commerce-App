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
  // Favori ürünleri (Product objeleri olarak) tutacak BehaviorSubject
  private favoritesItemsSource = new BehaviorSubject<Product[]>([]);
  // Dışarıya açılan Observable
  public favorites$: Observable<Product[]> = this.favoritesItemsSource.asObservable();

  constructor() {
    // Başlangıçta localStorage'dan yükle (isteğe bağlı)
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

  // Favorilerin güncel listesini anlık olarak döndürür
  getFavoritesList(): Product[] {
    return this.favoritesItemsSource.getValue();
  }

  // Bir ürünü favorilere ekler
  addFavorite(product: Product): void {
    const currentFavorites = this.getFavoritesList();
    // Eğer ürün zaten favorilerde değilse ekle
    if (!currentFavorites.some(item => item.id === product.id)) {
      const updatedFavorites = [...currentFavorites, product];
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites); // localStorage'a kaydet
      console.log(`FavoritesService: Added product ${product.id} to favorites.`);
    } else {
      console.log(`FavoritesService: Product ${product.id} already in favorites.`);
    }
  }

  // Bir ürünü favorilerden kaldırır
  removeFavorite(productId: number | string): void {
    const currentFavorites = this.getFavoritesList();
    const updatedFavorites = currentFavorites.filter(item => item.id !== productId);
    // Eğer liste değiştiyse güncelle
    if (updatedFavorites.length !== currentFavorites.length) {
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites); // localStorage'dan sil
      console.log(`FavoritesService: Removed product ${productId} from favorites.`);
    } else {
      console.warn(`FavoritesService: Product ID ${productId} not found in favorites for removal.`);
    }
  }

  // Belirli bir ürünün favorilerde olup olmadığını kontrol eden Observable döndürür
  isFavorite(productId: number | string): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.some(item => item.id === productId))
    );
  }
}
