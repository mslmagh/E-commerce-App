import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  categoryName?: string;
  imageUrl?: string;
  averageRating?: number;
  sellerId?: number;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private httpClient = inject(HttpClient);

  constructor() { }

  getProducts(categoryId?: number): Observable<Product[]> {
    console.log('ProductService: Fetching products from API...');
    
    let params = new HttpParams();
    
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
      console.log(`ProductService: Filtering by categoryId: ${categoryId}`);
    }

    return this.httpClient.get<Product[]>(this.apiUrl, { params }).pipe(
      tap(products => console.log(`ProductService: Fetched ${products.length} products.`)),
      catchError(this.handleError<Product[]>('getProducts', []))
    );
  }

  getProductById(id: number | string): Observable<Product | undefined> {
    const productId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(productId)) {
      console.error(`ProductService: Invalid product ID provided: ${id}`);
      return throwError(() => new Error(`Invalid product ID: ${id}`));
    }
    
    console.log(`ProductService: Fetching product with ID: ${productId} from API`);
    return this.httpClient.get<Product>(`${this.apiUrl}/${productId}`).pipe(
      tap(product => console.log(`ProductService: Fetched product for ID ${productId}:`, product)),
      catchError(this.handleError<Product | undefined>(`getProductById id=${productId}`))
    );
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category ID: ${categoryId}`);
    return this.getProducts(categoryId);
  }

  searchProducts(term: string): Observable<Product[]> {
    const searchTerm = term.trim().toLowerCase();
    if (!searchTerm) {
      return throwError(() => new Error('Search term is required'));
    }
    
    let params = new HttpParams().set('search', searchTerm);
    console.log(`ProductService: Searching for term: "${searchTerm}" via API`);
    
    return this.httpClient.get<Product[]>(`${this.apiUrl}/search`, { params }).pipe(
      tap(results => console.log(`ProductService: Found ${results.length} products for term "${searchTerm}".`)),
      catchError(error => {
        console.error('Search API not available, falling back to client-side filtering');
        return this.getProducts().pipe(
          map(products =>
            products.filter(product =>
              (product.name.toLowerCase().includes(searchTerm)) ||
              (product.description && product.description.toLowerCase().includes(searchTerm)) ||
              (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm))
            )
          ),
          tap(results => console.log(`ProductService: Found ${results.length} products with client-side filter.`))
        );
      })
    );
  }

  createProduct(product: ProductRequest): Observable<Product> {    
    console.log('ProductService: Creating new product', product);
    return this.httpClient.post<Product>(this.apiUrl, product).pipe(
      tap(newProduct => console.log('ProductService: Created new product with ID:', newProduct.id)),
      catchError(this.handleError<Product>('createProduct'))
    );
  }

  updateProduct(id: number, product: ProductRequest): Observable<Product> {
    console.log(`ProductService: Updating product with ID: ${id}`, product);
    return this.httpClient.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      tap(_ => console.log(`ProductService: Updated product with ID: ${id}`)),
      catchError(this.handleError<Product>('updateProduct'))
    );
  }

  deleteProduct(id: number): Observable<void> {
    console.log(`ProductService: Deleting product with ID: ${id}`);
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(_ => console.log(`ProductService: Deleted product with ID: ${id}`)),
      catchError(this.handleError<void>('deleteProduct'))
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
