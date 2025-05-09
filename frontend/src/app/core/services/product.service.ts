import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators'; // tap import edildi

export interface Product {
  id: number | string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  categorySlug?: string;
  rating?: number;
  stockQuantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // Mock datayı buraya taşıdık (kategori bilgisiyle)
  private mockProducts: Product[] = [
    { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Kulaklık', description: 'Aktif gürültü engelleme özellikli yüksek kaliteli kablosuz kulaklık.', categorySlug: 'elektronik' },
    { id: 2, name: 'Akıllı Saat Fit+', price: 1450, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Akıllı+Saat', description: 'Adım sayar, nabız ölçer, uyku takibi ve GPS özellikli modern akıllı saat.', categorySlug: 'elektronik' },
    { id: 3, name: 'Mekanik Klavye RGB', price: 650, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Klavye', description: 'Oyuncular ve yazarlar için özelleştirilebilir RGB aydınlatmalı, dayanıklı mekanik klavye.', categorySlug: 'elektronik' },
    { id: 4, name: 'Yoga Matı Kaymaz', price: 250, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Yoga+Matı', description: 'TPE malzemeden üretilmiş, çevre dostu, ekstra kalın ve kaymaz yüzeyli yoga matı.', categorySlug: 'spor-outdoor' },
    { id: 5, name: 'Blender Seti PowerMix', price: 1100, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Blender', description: 'Çok fonksiyonlu, güçlü motorlu mutfak blender seti.', categorySlug: 'ev-yasam' },
    { id: 6, name: 'Erkek Sneaker Air', price: 1999, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Sneaker', description: 'Hafif ve rahat, günlük kullanıma uygun erkek sneaker.', categorySlug: 'erkek-giyim' }
  ];

  constructor() { }

  getProducts(): Observable<Product[]> {
    console.log('ProductService: Fetching all mock products...');
    return of(this.mockProducts);
  }

  getProductById(id: number | string): Observable<Product | undefined> {
    const productId = typeof id === 'string' ? parseInt(id, 10) : id;
    console.log(`ProductService: Attempting to fetch product with numeric ID: ${productId}`);
    return this.getProducts().pipe(
      map(products => {
        const foundProduct = products.find(product => product.id === productId);
        console.log(`ProductService: Product found for ID ${productId}:`, foundProduct);
        return foundProduct;
      })
    );
  }

  getProductsByCategory(categorySlug: string): Observable<Product[]> {
    console.log(`ProductService: Fetching products for category: ${categorySlug}`);
    return this.getProducts().pipe(
      map(products => products.filter(product => product.categorySlug === categorySlug))
    );
  }

  // --- YENİ ARAMA METODU ---
  searchProducts(term: string): Observable<Product[]> {
    // Gelen arama terimini küçük harfe çevirip başındaki/sonundaki boşlukları alalım
    const searchTerm = term.trim().toLowerCase();
    console.log(`ProductService: Searching for term: "${searchTerm}"`);

    // Eğer arama terimi boşsa, boş bir dizi döndür
    if (!searchTerm) {
      return of([]); // Boş Observable<Product[]>
    }

    // Tüm ürünleri alıp filtreleyelim
    return this.getProducts().pipe(
      map(products =>
        products.filter(product =>
          // Ürün adı arama terimini içeriyorsa VEYA
          (product.name.toLowerCase().includes(searchTerm)) ||
          // Ürün açıklaması varsa VE arama terimini içeriyorsa
          (product.description && product.description.toLowerCase().includes(searchTerm))
        )
      ),
      // (Opsiyonel Debug) Filtreleme sonucunu konsola yazdır
      tap(results => console.log(`ProductService: Found <span class="math-inline">\{results\.length\} products for term "</span>{searchTerm}"`))
    );
  }
  // --- YENİ ARAMA METODU SONU ---
}
