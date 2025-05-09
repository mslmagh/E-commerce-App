import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
// ProductCardComponent'i import et
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
// Product interface'ini import et (rating ve stockQuantity eklenmiş haliyle)
import { Product } from '../../core/services/product.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

// --- Angular Material Modülleri (HTML'deki filtre/sıralama için) ---
import { MatCardModule } from '@angular/material/card'; // Filter card için
import { MatFormFieldModule } from '@angular/material/form-field'; // Select ve Inputlar için
import { MatInputModule } from '@angular/material/input'; // Fiyat aralığı inputları için
import { MatSelectModule } from '@angular/material/select'; // Sıralama dropdown'ı için
import { FormsModule } from '@angular/forms'; // ngModel için (MatSelect ve Inputlar ile kullanmak için)
// Eğer fiyat aralığı için slider kullanacaksanız MatSliderModule import etmelisiniz
// import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider'; // <-- MatDividerModule import edildi
// --------------------------------------------------------------------


@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent, // Paylaşılan ürün kartı componenti
    MatSnackBarModule, // Snackbar
    MatButtonModule, // Material butonlar
    // --- Angular Material Modüller Imports Dizisi ---
    MatCardModule, // mat-card
    MatFormFieldModule, // mat-form-field
    MatInputModule, // matInput
    MatSelectModule, // mat-select
    FormsModule, // [(ngModel)] kullanımı için
    MatDividerModule, // <-- MatDividerModule imports dizisine eklendi
    // MatSliderModule, // Eğer slider kullanacaksanız
    // ------------------------------------------
  ],
  templateUrl: './homepage.component.html', // HTML yapısı
  styleUrls: ['./homepage.component.css'] // CSS stilleri (Layout ve görünüm buradadır)
})
export class HomepageComponent implements OnInit {

  // Mock ürün verisi (Product tipinde - rating ve stockQuantity eklenmiş haliyle)
  featuredProducts: Product[] = [
    // rating ve stockQuantity eklendi
    { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, rating: 4.7, stockQuantity: 25, imageUrl: 'assets/images/kulaklik.jpg', description: 'Aktif gürültü engelleme özellikli...', categorySlug: 'elektronik' },
    { id: 2, name: 'Akıllı Saat Fit+', price: 1450, rating: 4.5, stockQuantity: 0, imageUrl: 'assets/images/saat.png', description: 'Adım sayar, nabız ölçer...', categorySlug: 'elektronik' },
    { id: 3, name: 'Mekanik Klavye RGB', price: 650, rating: 4.8, stockQuantity: 10, imageUrl: 'assets/images/klavye.jpg', description: 'Oyuncular ve yazarlar için...', categorySlug: 'elektronik' },
    { id: 4, name: 'Yoga Matı Kaymaz', price: 250, rating: 4.9, stockQuantity: 5, imageUrl: 'assets/images/mat.jpg', description: 'TPE malzemeden üretilmiş...', categorySlug: 'spor-outdoor' },
    { id: 5, name: 'Blender Seti PowerMix', price: 1100, rating: 4.6, stockQuantity: 18, imageUrl: 'assets/images/blender.jpg', description: 'Çok fonksiyonlu, güçlü motorlu...', categorySlug: 'ev-yasam' },
    { id: 6, name: 'Erkek Sneaker Air', price: 1999, rating: 4.7, stockQuantity: 30, imageUrl: 'assets/images/sneaker.jpg', description: 'Hafif ve rahat, günlük kullanıma uygun...', categorySlug: 'erkek-giyim' }
  ];

  // --- Yeni Eklenen Sıralama ve Filtreleme Değişkenleri ---
  selectedSortOption: string = 'default'; // HTML mat-select'e bağlı
  minPrice: number | null = null; // HTML input'a bağlı
  maxPrice: number | null = null; // HTML input'a bağlı
  sortedProducts: Product[] = []; // HTML *ngFor'a bağlı (filtrelenmiş ve sıralanmış liste)
  // ------------------------------------------------------

  isLoading: boolean = false; // Yükleme durumu

  constructor(
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('HomepageComponent ngOnInit');
    // Component yüklendiğinde ürünleri başlangıç filtrelemesi ve sıralamasıyla yükle
    this.updateDisplayedProducts();
  }

  // Sepete Ekle mantığı
  addToCart(product: Product | undefined | null): void {
    if (product) {
      console.log(`${this.constructor.name}: Adding product to cart:`, product.name);
      this.cartService.addToCart(product);
      this.snackBar.open(`'${product.name}' sepete eklendi`, 'Tamam', {
        duration: 2500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    } else {
      console.error(`${this.constructor.name}: Cannot add null/undefined product to cart.`);
      this.snackBar.open("Ürün sepete eklenemedi!", 'Kapat', {
         duration: 3000,
         panelClass: ['error-snackbar']
        });
    }
  }

  // --- Sıralama ve Filtreleme Metotları ---

  // Sıralama seçeneği değiştiğinde veya filtreler uygulandığında çalışır
  // Hem sıralama hem de filtreleme buradan tetiklenecek
  updateDisplayedProducts(): void {
    console.log('Ürün listesi güncelleniyor. Sıralama:', this.selectedSortOption, 'Fiyat Aralığı:', this.minPrice, '-', this.maxPrice);

    // 1. Filtreleme:
    let filteredProducts = [...this.featuredProducts]; // Orijinal listeden başla

    // Fiyat Aralığı Filtrelemesi
    if (this.minPrice !== null) {
      filteredProducts = filteredProducts.filter(product => product.price >= this.minPrice!); // minPrice'dan büyük veya eşit
    }
    if (this.maxPrice !== null) {
      filteredProducts = filteredProducts.filter(product => product.price <= this.maxPrice!); // maxPrice'dan küçük veya eşit
    }
     // Diğer filtreler buraya eklenecek (Marka, Renk, Beden vb.)

    // 2. Sıralama:
    let productsToSort = [...filteredProducts]; // Filtrelenmiş liste üzerinde sıralama yap

    switch (this.selectedSortOption) {
      case 'price-asc': // Fiyata Göre Artan
        productsToSort.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc': // Fiyata Göre Azalan
        productsToSort.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc': // Puana Göre Yüksekten (rating undefined/null olabilir ihtimaline karşı)
        productsToSort.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-asc': // Puana Göre Düşükten (rating undefined/null olabilir ihtimaline karşı)
        productsToSort.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'default': // Varsayılan Sıralama (filtre uygulanmış orijinal sıra)
      default:
         // Filtreleme orijinal dizinin sırasını koruyorsa doğrudan filteredProducts'ı kullanabiliriz
        productsToSort = filteredProducts; // Direkt filtrelenmiş listeyi ata (sıralama yok)
        break;
    }

    this.sortedProducts = productsToSort; // Filtrelenmiş ve sıralanmış listeyi güncelle
     console.log('Ürünler güncellendi. Gösterilen ürün sayısı:', this.sortedProducts.length);
  }

   // Fiyat aralığı inputları değiştiğinde filtrelemeyi tetikle (HTML'deki (input) olayı ile bağlı)
   onPriceRangeChange(): void {
       // Input değerlerinin sayı olduğundan emin olalım, string gelebilir
       // parseFloat kullanmak hem tam sayı hem ondalıklı sayılar için uygundur
       this.minPrice = this.minPrice !== null ? parseFloat(this.minPrice as any) : null;
       this.maxPrice = this.maxPrice !== null ? parseFloat(this.maxPrice as any) : null;

        // Eğer girilen değer geçerli bir sayı değilse null yap
       if (this.minPrice !== null && isNaN(this.minPrice)) this.minPrice = null;
       if (this.maxPrice !== null && isNaN(this.maxPrice)) this.maxPrice = null;

        // Fiyat aralığı değiştiğinde ürün listesini güncelle
        this.updateDisplayedProducts();
   }

  // Sıralama select kutusu değiştiğinde filtreleme/sıralamayı tetikle (HTML'deki (valueChange) olayı ile bağlı)
   onSortOptionChange(): void {
      // Sıralama seçeneği değiştiğinde ürün listesini güncelle
      this.updateDisplayedProducts();
   }


  // ------------------------------------------------------
}
