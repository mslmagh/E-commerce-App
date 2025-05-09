import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, delay } from 'rxjs';
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

  // Mock data for development without backend
  private mockProducts: Product[] = [
    {
      id: 1,
      name: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones with long battery life',
      price: 129.99,
      stockQuantity: 15,
      categoryId: 1,
      categoryName: 'Electronics',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.5
    },
    {
      id: 2,
      name: 'Smart Watch',
      description: 'Fitness and health tracking smart watch',
      price: 199.99,
      stockQuantity: 8,
      categoryId: 1,
      categoryName: 'Electronics',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.3
    },
    {
      id: 3,
      name: 'Laptop Backpack',
      description: 'Water-resistant backpack with laptop compartment',
      price: 49.99,
      stockQuantity: 20,
      categoryId: 2,
      categoryName: 'Accessories',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.8
    },
    {
      id: 4,
      name: 'Coffee Maker',
      description: 'Programmable coffee maker with thermal carafe',
      price: 79.99,
      stockQuantity: 12,
      categoryId: 3,
      categoryName: 'Home & Kitchen',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.2
    },
    {
      id: 5,
      name: 'Running Shoes',
      description: 'Lightweight running shoes with cushioned sole',
      price: 89.99,
      stockQuantity: 25,
      categoryId: 4,
      categoryName: 'Sports',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.7
    },
    {
      id: 6,
      name: 'Gaming Mouse',
      description: 'High-precision gaming mouse with customizable buttons',
      price: 59.99,
      stockQuantity: 18,
      categoryId: 1,
      categoryName: 'Electronics',
      imageUrl: 'https://via.placeholder.com/300',
      averageRating: 4.4
    }
  ];

  constructor() { }

  getProducts(categoryId?: number): Observable<Product[]> {
    console.log('ProductService: Fetching products from API...');
    
    // Use mock data if mockApi is enabled
    if (environment.mockApi) {
      console.log('ProductService: Using mock data (mockApi=true)');
      let filteredProducts = [...this.mockProducts];
      
      if (categoryId) {
        console.log(`ProductService: Filtering mock products by categoryId: ${categoryId}`);
        filteredProducts = this.mockProducts.filter(p => p.categoryId === categoryId);
      }
      
      return of(filteredProducts).pipe(
        delay(300), // Add a small delay to simulate network request
        tap(products => console.log(`ProductService: Fetched ${products.length} mock products.`))
      );
    }
    
    // Use actual API if mockApi is disabled
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
      return of(undefined);
    }
    
    if (environment.mockApi) {
      console.log(`ProductService: Fetching mock product with ID: ${productId}`);
      const product = this.mockProducts.find(p => p.id === productId);
      return of(product).pipe(
        delay(200),
        tap(product => console.log(`ProductService: Fetched mock product for ID ${productId}:`, product))
      );
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
      return of([]);
    }
    
    if (environment.mockApi) {
      console.log(`ProductService: Searching mock products for term: "${searchTerm}"`);
      const results = this.mockProducts.filter(product =>
        (product.name.toLowerCase().includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm))
      );
      return of(results).pipe(
        delay(300),
        tap(results => console.log(`ProductService: Found ${results.length} mock products for term "${searchTerm}".`))
      );
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
    if (environment.mockApi) {
      console.log('ProductService: Creating new mock product', product);
      const newProduct: Product = {
        ...product,
        id: Math.max(...this.mockProducts.map(p => p.id)) + 1,
        categoryName: 'Mock Category'
      };
      this.mockProducts.push(newProduct);
      return of(newProduct).pipe(
        delay(300),
        tap(product => console.log('ProductService: Created new mock product with ID:', product.id))
      );
    }
    
    console.log('ProductService: Creating new product', product);
    return this.httpClient.post<Product>(this.apiUrl, product).pipe(
      tap(newProduct => console.log('ProductService: Created new product with ID:', newProduct.id)),
      catchError(this.handleError<Product>('createProduct'))
    );
  }

  updateProduct(id: number, product: ProductRequest): Observable<Product> {
    if (environment.mockApi) {
      console.log(`ProductService: Updating mock product with ID: ${id}`, product);
      const index = this.mockProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        const updatedProduct: Product = {
          ...this.mockProducts[index],
          ...product
        };
        this.mockProducts[index] = updatedProduct;
        return of(updatedProduct).pipe(
          delay(300),
          tap(_ => console.log(`ProductService: Updated mock product with ID: ${id}`))
        );
      }
      return throwError(() => new Error(`Product with ID ${id} not found`));
    }
    
    console.log(`ProductService: Updating product with ID: ${id}`, product);
    return this.httpClient.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      tap(_ => console.log(`ProductService: Updated product with ID: ${id}`)),
      catchError(this.handleError<Product>('updateProduct'))
    );
  }

  deleteProduct(id: number): Observable<void> {
    if (environment.mockApi) {
      console.log(`ProductService: Deleting mock product with ID: ${id}`);
      const index = this.mockProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        this.mockProducts.splice(index, 1);
        return of(undefined).pipe(
          delay(300),
          tap(_ => console.log(`ProductService: Deleted mock product with ID: ${id}`))
        );
      }
      return throwError(() => new Error(`Product with ID ${id} not found`));
    }
    
    console.log(`ProductService: Deleting product with ID: ${id}`);
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(_ => console.log(`ProductService: Deleted product with ID: ${id}`)),
      catchError(this.handleError<void>('deleteProduct'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: Status ${error.status}, Body: `, error.error);
      return throwError(() => new Error(`${operation} failed; please try again later.`));
    };
  }
}
