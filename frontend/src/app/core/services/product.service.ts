import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Product {
  id: number; // Long to number
  name: string;
  description?: string; // Backend'de de nullable olabilir
  price: number; // BigDecimal to number
  stockQuantity?: number; // Integer to number
  categoryId?: number; // Long to number
  categoryName?: string;
  imageUrl?: string;
  averageRating?: number; // BigDecimal to number
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private httpClient = inject(HttpClient);

  constructor() { }

  getProducts(): Observable<Product[]> {
    console.log('ProductService: Fetching all products from API...');
    return this.httpClient.get<Product[]>(this.apiUrl).pipe(
      tap(products => console.log(`ProductService: Fetched ${products.length} products.`)),
      catchError(this.handleError<Product[]>('getProducts', []))
    );
  }

  getProductById(id: number | string): Observable<Product | undefined> {
    const productId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(productId)) {
      console.error(`ProductService: Invalid product ID provided: ${id}`);
      return of(undefined);
    }
    console.log(`ProductService: Fetching product with ID: ${productId} from API`);
    return this.httpClient.get<Product>(`${this.apiUrl}/${productId}`).pipe(
      tap(product => console.log(`ProductService: Fetched product for ID ${productId}:`, product)),
      catchError(this.handleError<Product | undefined>(`getProductById id=${productId}`))
    );
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category ID: ${categoryId}`);
    return this.httpClient.get<Product[]>(`${this.apiUrl}?categoryId=${categoryId}`).pipe(
      tap(products => console.log(`ProductService: Fetched ${products.length} products for category ID ${categoryId}.`)),
      catchError(this.handleError<Product[]>('getProductsByCategory', []))
    );
  }
  getProductsByCategorySlug(categorySlug: string): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category slug: ${categorySlug}`);
    return this.getProducts().pipe(
      map(products => products.filter(product =>
        product.categoryName?.toLowerCase().replace(/\s+/g, '-').includes(categorySlug.toLowerCase())
      )),
      tap(filteredProducts => console.log(`ProductService: Found ${filteredProducts.length} products for category slug ${categorySlug} (client-side filter).`)),
      catchError(this.handleError<Product[]>('getProductsByCategorySlug', []))
    );
  }


  searchProducts(term: string): Observable<Product[]> {
    const searchTerm = term.trim().toLowerCase();
    if (!searchTerm) {
      return of([]);
    }
    console.log(`ProductService: Searching for term: "${searchTerm}" via API`);
    return this.getProducts().pipe(
      map(products =>
        products.filter(product =>
          (product.name.toLowerCase().includes(searchTerm)) ||
          (product.description && product.description.toLowerCase().includes(searchTerm)) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm))
        )
      ),
      tap(results => console.log(`ProductService: Found ${results.length} products for term "${searchTerm}" (client-side filter).`)),
      catchError(this.handleError<Product[]>('searchProducts', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: Status ${error.status}, Body: `, error.error);
      return throwError(() => new Error(`${operation} failed; please try again later.`));
    };
  }
}
