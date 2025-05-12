import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductComparisonService } from '../../../core/services/product-comparison.service';
import { ProductService, Product } from '../../../core/services/product.service';
import { Subscription, switchMap, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-product-comparison',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './product-comparison.component.html',
  styleUrls: ['./product-comparison.component.css']
})
export class ProductComparisonComponent implements OnInit, OnDestroy {
  comparedProducts: Product[] = [];
  isLoading = false;
  private comparisonIdsSubscription!: Subscription;
  displayedColumns: string[] = ['feature']; // Dinamik olarak ürün adları eklenecek

  // Karşılaştırılacak özelliklerin listesi
  // Her özellik için bir `label` (gösterilecek başlık) ve bir `key` (Product nesnesindeki alan adı)
  featuresToCompare: { key: keyof Product | 'actions', label: string, isFeature: boolean, render?: (product: Product) => string | number }[] = [
    { key: 'name', label: 'Ürün Adı', isFeature: true, render: (p) => p.name },
    { key: 'imageUrl', label: 'Görsel', isFeature: true }, // Özel render HTML'de yapılacak
    { key: 'price', label: 'Fiyat', isFeature: true, render: (p) => p.price }, // Pipe HTML'de
    { key: 'categoryName', label: 'Kategori', isFeature: true, render: (p) => p.categoryName || '-' },
    { key: 'averageRating', label: 'Puan', isFeature: true }, // Özel render HTML'de yapılacak
    { key: 'stockQuantity', label: 'Stok', isFeature: true, render: (p) => p.stockQuantity },
    { key: 'description', label: 'Açıklama', isFeature: true, render: (p) => p.description || '-' },
    { key: 'actions', label: 'İşlemler', isFeature: false } // Kaldırma butonu için
  ];

  constructor(
    private productComparisonService: ProductComparisonService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.comparisonIdsSubscription = this.productComparisonService.comparisonList$.pipe(
      switchMap(ids => {
        if (ids && ids.length > 0) {
          this.isLoading = true;
          return this.productService.getProductsByIds(ids);
        } else {
          return of([]); // ID listesi boşsa boş array döndür
        }
      })
    ).subscribe({
      next: (products) => {
        this.comparedProducts = products;
        // displayedColumns'ı güncelle: 'feature' + ürün adları
        this.displayedColumns = ['feature', ...this.comparedProducts.map(p => p.name)]; 
        // Veya daha güvenli olması için ID: this.displayedColumns = ['feature', ...this.comparedProducts.map(p => 'product-' + p.id)];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching products for comparison:', err);
        this.snackBar.open('Karşılaştırma ürünleri yüklenirken hata oluştu.', 'Kapat', { duration: 3000 });
        this.comparedProducts = [];
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.comparisonIdsSubscription) {
      this.comparisonIdsSubscription.unsubscribe();
    }
  }

  removeFromCompare(productId: number): void {
    this.productComparisonService.removeFromCompare(productId);
    // Liste otomatik olarak güncellenecek ve ngOnInit'teki subscription bunu yakalayacak.
  }

  // Tablo için veri kaynağını oluşturma
  getTableDataSource(): any[] {
    if (!this.comparedProducts || this.comparedProducts.length === 0) {
      return [];
    }

    return this.featuresToCompare.map(feature => {
      const row: any = { feature: feature.label }; // İlk sütun özellik adı
      this.comparedProducts.forEach(product => {
        // Ürün adını (veya ID'sini) sütun başlığı olarak kullanıyoruz
        const columnKey = product.name; // Veya 'product-' + product.id
        if (feature.key === 'actions') {
          row[columnKey] = product.id; // İşlem yapılacak ürünün ID'si
        } else if (feature.key === 'imageUrl') {
          row[columnKey] = product.imageUrl || 'https://via.placeholder.com/100x100/EEEEEE/999999?text=Yok';
        } else if (feature.key === 'averageRating') {
          row[columnKey] = { rating: product.averageRating, count: product.reviewCount }; // Rating ve review count için obje
        } else if (feature.render) {
          row[columnKey] = feature.render(product); 
        } else {
          row[columnKey] = (product as any)[feature.key] || '-';
        }
      });
      return row;
    });
  }
} 