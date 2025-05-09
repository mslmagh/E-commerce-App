import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from './product.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environment';
import { AuthService } from './auth.service';

export interface UserFavorite {
  id: number;
  userId: number;
  productId: number;
  product: Product;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = `${environment.apiUrl}/favorites`;
  private platformId = inject(PLATFORM_ID);
  private favoritesItemsSource = new BehaviorSubject<Product[]>([]);
  public favorites$: Observable<Product[]> = this.favoritesItemsSource.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    if (this.authService.isLoggedIn()) {
      this.fetchFavoritesFromApi();
    } else {
      this.loadFavoritesFromLocalStorage();
    }
  }

  private fetchFavoritesFromApi(): void {
    this.http.get<UserFavorite[]>(this.apiUrl).pipe(
      map(favorites => favorites.map(fav => fav.product)),
      tap(products => {
        console.log('FavoritesService: Fetched favorites from API', products);
        this.favoritesItemsSource.next(products);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching favorites from API', error);
        // On error, try to load from local storage as fallback
        this.loadFavoritesFromLocalStorage();
        return throwError(() => new Error('Failed to fetch favorites'));
      })
    ).subscribe();
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
          localStorage.removeItem('userFavorites');
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
    if (this.authService.isLoggedIn()) {
      this.addFavoriteToApi(product);
    } else {
      this.addFavoriteToLocal(product);
    }
  }

  private addFavoriteToApi(product: Product): void {
    this.http.post<UserFavorite>(`${this.apiUrl}/${product.id}`, {}).pipe(
      tap(_ => {
        console.log(`FavoritesService: Added product ${product.id} to favorites via API`);
        const currentFavorites = this.getFavoritesList();
        if (!currentFavorites.some(item => item.id === product.id)) {
          const updatedFavorites = [...currentFavorites, product];
          this.favoritesItemsSource.next(updatedFavorites);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error adding product ${product.id} to favorites`, error);
        return throwError(() => new Error('Failed to add favorite'));
      })
    ).subscribe();
  }

  private addFavoriteToLocal(product: Product): void {
    const currentFavorites = this.getFavoritesList();
    if (!currentFavorites.some(item => item.id === product.id)) {
      const updatedFavorites = [...currentFavorites, product];
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites);
      console.log(`FavoritesService: Added product ${product.id} to local favorites.`);
    } else {
      console.log(`FavoritesService: Product ${product.id} already in favorites.`);
    }
  }

  removeFavorite(productId: number): void {
    if (this.authService.isLoggedIn()) {
      this.removeFavoriteFromApi(productId);
    } else {
      this.removeFavoriteFromLocal(productId);
    }
  }

  private removeFavoriteFromApi(productId: number): void {
    this.http.delete<void>(`${this.apiUrl}/${productId}`).pipe(
      tap(_ => {
        console.log(`FavoritesService: Removed product ${productId} from favorites via API`);
        const currentFavorites = this.getFavoritesList();
        const updatedFavorites = currentFavorites.filter(item => item.id !== productId);
        this.favoritesItemsSource.next(updatedFavorites);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error removing product ${productId} from favorites`, error);
        return throwError(() => new Error('Failed to remove favorite'));
      })
    ).subscribe();
  }

  private removeFavoriteFromLocal(productId: number): void {
    const currentFavorites = this.getFavoritesList();
    const updatedFavorites = currentFavorites.filter(item => item.id !== productId);
    if (updatedFavorites.length !== currentFavorites.length) {
      this.favoritesItemsSource.next(updatedFavorites);
      this.saveFavoritesToLocalStorage(updatedFavorites);
      console.log(`FavoritesService: Removed product ${productId} from local favorites.`);
    } else {
      console.warn(`FavoritesService: Product ID ${productId} not found in favorites for removal.`);
    }
  }

  isFavorite(productId: number): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.some(item => item.id === productId))
    );
  }

  syncFavoritesWithApi(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    const localFavorites = this.getFavoritesList();
    if (!localFavorites || localFavorites.length === 0) {
      this.fetchFavoritesFromApi();
      return;
    }

    // First, get current favorites from API
    this.http.get<UserFavorite[]>(this.apiUrl).pipe(
      map(favorites => favorites.map(fav => fav.product)),
      tap(apiProducts => {
        console.log('FavoritesService: Fetched current API favorites for syncing', apiProducts);
        
        // Find products that are in local storage but not in API
        const productsToAdd = localFavorites.filter(localProduct => 
          !apiProducts.some(apiProduct => apiProduct.id === localProduct.id)
        );
        
        // Add each local favorite to API
        if (productsToAdd.length > 0) {
          console.log(`FavoritesService: Syncing ${productsToAdd.length} local favorites to API`);
          
          // For simplicity, we'll just add them one by one - in real app you might use forkJoin or similar
          productsToAdd.forEach(product => {
            this.addFavoriteToApi(product);
          });
        }
        
        // Update local state with combined list
        const combinedFavorites = [...apiProducts];
        productsToAdd.forEach(product => {
          if (!combinedFavorites.some(p => p.id === product.id)) {
            combinedFavorites.push(product);
          }
        });
        
        this.favoritesItemsSource.next(combinedFavorites);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('userFavorites');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error syncing favorites with API', error);
        return throwError(() => new Error('Failed to sync favorites with API'));
      })
    ).subscribe();
  }
}
