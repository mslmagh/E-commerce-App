import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router} from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Admin Ürün Modeli
export interface AdminProduct {
  id: string | number;
  name: string;
  sku?: string;
  price: number;
  stockQuantity: number;
  status: 'Yayında' | 'Taslak' | 'Onay Bekliyor' | 'Reddedildi' | 'Stok Tükendi';
  imageUrl?: string;
  sellerName?: string;
  category?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-product-list.component.html',
  styles: [`
    .product-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-field { width: 100%; max-width: 400px; }
    table.mat-mdc-table { width: 100%; min-width: 900px; box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; overflow-x: auto; margin-bottom: 16px; }
    .mat-column-imageUrl { width: 80px; padding-right: 16px !important; }
    .product-thumbnail { width: 50px; height: 50px; object-fit: cover; border-radius: 4px; vertical-align: middle; }
    .mat-column-actions { width: 130px; text-align: center; }
    .actions-cell { text-align: center; }
    .actions-cell button:not(:last-child) { margin-right: 5px; }
    .loading-spinner-container, .no-products-message { text-align: center; padding: 40px; }
    .no-products-message { color: rgba(0,0,0,0.54); }
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }

    /* Durum chip benzeri stil (Admin için biraz farklı renkler) */
    .status-chip {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 500;
      text-transform: uppercase;
    }
    .status-yayinda { background-color: #E8F5E9; color: #4CAF50; } /* Green */
    .status-taslak { background-color: #ECEFF1; color: #607D8B; } /* Blue Grey */
    .status-onay-bekliyor { background-color: #FFF8E1; color: #FFC107; } /* Amber */
    .status-reddedildi { background-color: #FFEBEE; color: #F44336; } /* Red */
    .status-stok-tukendi { background-color: #CFD8DC; color: #455A64; } /* Grey */
  `]
})
export class AdminProductListComponent implements OnInit, AfterViewInit {
  // Seller panelindeki kolonlara benzer, Admin için ek kolonlar olabilir (sellerName vb.)
  displayedColumns: string[] = ['imageUrl', 'name', 'sellerName', 'category', 'price', 'stockQuantity', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<AdminProduct>([]);
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
    // private adminProductService: any // Backend servisi şimdilik any
  ) {}

  ngOnInit(): void {
    // Component yüklendiğinde ürünleri çek (şimdilik mock)
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Kolonlara göre sıralama ayarları
    this.dataSource.sortingDataAccessor = (item: AdminProduct, property: string) => {
        switch (property) {
          case 'createdAt': return item.createdAt ? item.createdAt.getTime() : 0;
          case 'name': return item.name.toLowerCase();
          case 'sellerName': return item.sellerName?.toLowerCase() || '';
          case 'category': return item.category?.toLowerCase() || '';
          default: return (item as any)[property];
        }
     };

     // Filtreleme mantığı (isim, sku, satıcı adı, kategori, status)
     this.dataSource.filterPredicate = (data: AdminProduct, filter: string): boolean => {
         const searchString = (data.name + data.sku + data.sellerName + data.category + data.status)
                                .toLowerCase();
         return searchString.includes(filter.toLowerCase());
     };
  }

  loadProducts(): void {
    this.isLoading = true;

    // --- MOCK DATA İLE SİMÜLASYON ---
    // Backend hazır olunca bu kısmı gerçek API çağrısı ile değiştireceksiniz.
    setTimeout(() => {
      const mockProducts: AdminProduct[] = [
        { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, stockQuantity: 50, status: 'Yayında', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün1', sellerName: 'Ses Dünyası', category: 'Elektronik', createdAt: new Date(2024, 0, 10) },
        { id: 2, name: 'Akıllı Saat Fit+', price: 1450, stockQuantity: 0, status: 'Stok Tükendi', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün2', sellerName: 'Tekno Moda', category: 'Elektronik', createdAt: new Date(2024, 1, 15) },
        { id: 3, name: 'Mekanik Klavye RGB', price: 650, stockQuantity: 15, status: 'Onay Bekliyor', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün3', sellerName: 'Oyun Ekipmanları', category: 'Elektronik', createdAt: new Date(2024, 2, 20) },
        { id: 4, name: 'Yoga Matı Kaymaz', price: 250, stockQuantity: 30, status: 'Yayında', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün4', sellerName: 'Sağlıklı Yaşam', category: 'Spor & Outdoor', createdAt: new Date(2024, 3, 5) },
        { id: 5, name: 'El Yapımı Seramik Kupa', price: 75, stockQuantity: 10, status: 'Taslak', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün5', sellerName: 'Butik Seramik', category: 'Ev & Yaşam', createdAt: new Date(2024, 4, 1) },
        { id: 6, name: 'Organik Pamuk Tişört', price: 120, stockQuantity: 5, status: 'Reddedildi', imageUrl: 'https://via.placeholder.com/50/cccccc/ffffff?text=Ürün6', sellerName: 'Doğa Giyim', category: 'Giyim', createdAt: new Date(2024, 4, 6) },
      ];
      this.dataSource.data = mockProducts;
      this.isLoading = false;
      console.log('Mock ürünler yüklendi:', mockProducts);
    }, 1000); // 1 saniye gecikme ile yükleme simülasyonu
  }

  // Filtreleme metodu
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Yeni ürün ekleme sayfasına yönlendirme (Bu rotayı tanımlamamız gerekecek)
  navigateToAddNewProduct(): void {
    console.log('AdminProductListComponent: Navigating to add new product.');
    this.router.navigate(['/admin/products/new']);
  }

  // Ürün düzenleme sayfasına yönlendirme (Bu rotayı tanımlamamız gerekecek)
  editProduct(product: AdminProduct): void {
    console.log('AdminProductListComponent: Navigating to edit product ID:', product.id);
    this.router.navigate(['/admin/products/edit', product.id]);
  }

  // Ürün silme işlemi (Backend entegrasyonu gerektirecek)
  deleteProduct(product: AdminProduct): void {
    console.log('TODO: Implement delete product backend call for ID:', product.id);
    if (confirm(`'${product.name}' adlı ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      this.isLoading = true;
      // Backend silme servisi çağrılacak
      // this.adminProductService.deleteProduct(product.id).subscribe({ ... });

      // Silme simülasyonu
      setTimeout(() => {
        // Mock data'dan ürünü çıkar
        this.dataSource.data = this.dataSource.data.filter(p => p.id !== product.id);
        this.snackBar.open(`'${product.name}' silindi (simülasyon).`, 'Tamam', { duration: 2000 });
        this.isLoading = false;
         if (this.dataSource.paginator) { // Silme sonrası paginator state'ini kontrol et
             this.dataSource.paginator.pageIndex = 0;
         }
      }, 1000);
    }
  }

  // Durum chip rengi için yardımcı metot
   getStatusClass(status: AdminProduct['status']): string {
    switch (status) {
      case 'Yayında': return 'status-yayinda';
      case 'Taslak': return 'status-taslak';
      case 'Onay Bekliyor': return 'status-onay-bekliyor';
      case 'Reddedildi': return 'status-reddedildi';
      case 'Stok Tükendi': return 'status-stok-tukendi';
      default: return '';
    }
  }
}
