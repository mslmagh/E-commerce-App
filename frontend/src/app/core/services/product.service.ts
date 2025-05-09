import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment';

// Backend ProductDto.java ile uyumlu arayüz
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
  // Frontend'e özel olabilecek ama backend DTO'sunda olmayan alanlar için:
  // categorySlug?: string; // Bu backend DTO'sunda yok, gerekirse kaldırılabilir veya categoryName'den türetilebilir.
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private httpClient = inject(HttpClient);

  constructor() { }

  // Tüm ürünleri backend'den getir
  getProducts(): Observable<Product[]> {
    console.log('ProductService: Fetching all products from API...');
    return this.httpClient.get<Product[]>(this.apiUrl).pipe(
      tap(products => console.log(`ProductService: Fetched ${products.length} products.`)),
      catchError(this.handleError<Product[]>('getProducts', []))
    );
  }

  // ID ile tek bir ürünü backend'den getir
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

  // Kategoriye göre ürünleri backend'den getirme (Backend'de bu endpoint'in olması varsayılıyor)
  // Örn: /api/products?categoryId={id} veya /api/categories/{categoryId}/products
  // Şimdilik, backend /api/products endpoint'inin categoryId ile filtrelemeyi desteklediğini varsayalım.
  // Eğer desteklemiyorsa, tüm ürünler çekilip frontend'de filtrelenir veya backend güncellenir.
  getProductsByCategory(categoryId: number): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category ID: ${categoryId}`);
    // Backend'inizin kategoriye göre filtreleme yapıp yapmadığını kontrol edin.
    // Yoksa, tüm ürünleri çekip filtreleyebilirsiniz:
    // return this.getProducts().pipe(map(products => products.filter(p => p.categoryId === categoryId)));
    return this.httpClient.get<Product[]>(`${this.apiUrl}?categoryId=${categoryId}`).pipe(
      tap(products => console.log(`ProductService: Fetched ${products.length} products for category ID ${categoryId}.`)),
      catchError(this.handleError<Product[]>('getProductsByCategory', []))
    );
  }
  // Kategori slug'ına göre ürünleri getiren metod (frontend'de categoryId'ye çevrilerek kullanılabilir)
  getProductsByCategorySlug(categorySlug: string): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category slug: ${categorySlug}`);
    // Bu metod, ya backend'in slug ile filtrelemeyi desteklemesini ya da
    // frontend'in slug'dan categoryId'ye bir çevrim yapmasını gerektirir (örn: CategoryService aracılığıyla).
    // Şimdilik basit bir örnek olarak, tüm ürünleri çekip slug'a benzer bir categoryName ile filtreleyelim (ideal değil).
    return this.getProducts().pipe(
      map(products => products.filter(product =>
        product.categoryName?.toLowerCase().replace(/\s+/g, '-').includes(categorySlug.toLowerCase())
      )),
      tap(filteredProducts => console.log(`ProductService: Found ${filteredProducts.length} products for category slug ${categorySlug} (client-side filter).`)),
      catchError(this.handleError<Product[]>('getProductsByCategorySlug', []))
    );
  }


  // Arama metodu (Backend'de /api/products/search?q={term} gibi bir endpoint olduğu varsayılıyor)
  searchProducts(term: string): Observable<Product[]> {
    const searchTerm = term.trim().toLowerCase();
    if (!searchTerm) {
      return of([]);
    }
    console.log(`ProductService: Searching for term: "${searchTerm}" via API`);
    // Backend'inizin arama endpoint'ini buraya girin.
    // Örnek: return this.httpClient.get<Product[]>(`${this.apiUrl}/search?q=${searchTerm}`).pipe(
    // Şimdilik, frontend tarafında filtreleme yapıyoruz, backend'e arama endpointi eklenmeli.
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

  // HttpClient için genel hata yakalama
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: Status ${error.status}, Body: `, error.error);
      // Kullanıcıya yönelik hata mesajı yönetimi burada veya component seviyesinde yapılabilir.
      // this.snackBar.open(`${operation} başarısız oldu. Lütfen tekrar deneyin.`, 'Kapat', { duration: 3000 });
      return throwError(() => new Error(`${operation} failed; please try again later.`));
      // return of(result as T); // Uygulamanın devam etmesi için boş sonuç (bazı durumlarda tercih edilebilir)
    };
  }
}