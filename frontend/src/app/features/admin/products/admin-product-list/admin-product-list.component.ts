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
import { ProductService, Product as BackendProduct } from '../../../../core/services/product.service';
import { catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

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
  displayedColumns: string[] = ['imageUrl', 'name', 'categoryName', 'price', 'stockQuantity', 'derivedStatus', 'deactivationReason', 'deactivatedAt', 'actions'];
  dataSource = new MatTableDataSource<BackendProduct>([]);
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: BackendProduct, property: string) => {
        switch (property) {
          case 'name': return item.name.toLowerCase();
          case 'categoryName': return item.categoryName?.toLowerCase() || '';
          default: return (item as any)[property];
        }
     };

     this.dataSource.filterPredicate = (data: BackendProduct, filter: string): boolean => {
         const searchString = (data.name + (data.categoryName || '') + data.price + data.stockQuantity)
                                .toLowerCase();
         return searchString.includes(filter.toLowerCase());
     };
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products: BackendProduct[]) => {
        this.dataSource.data = products;
        this.isLoading = false;
        console.log(`Backend'den ürünler yüklendi:`, products);
      },
      error: (err) => {
        this.isLoading = false;
        this.dataSource.data = [];
        this.snackBar.open(`Ürünler yüklenirken hata oluştu: ${err.message || 'Bilinmeyen Hata'}`, 'Kapat', { duration: 3000 });
        console.error('Ürünler yüklenirken hata:', err);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  navigateToAddNewProduct(): void {
    console.log('AdminProductListComponent: Navigating to add new product.');
    this.router.navigate(['/admin/products/new']);
  }

  deactivateProduct(product: BackendProduct): void {
    const reason = prompt(`'${product.name}' adlı ürünü neden pasife almak istiyorsunuz?\n(Bu bilgi satıcıya gösterilecektir)`);

    if (reason === null || reason.trim() === '') {
      this.snackBar.open('Pasife alma işlemi iptal edildi veya sebep belirtilmedi.', 'Kapat', { duration: 3000 });
      return;
    }

    if (confirm(`'${product.name}' adlı ürünü pasife almak istediğinizden emin misiniz?\nSebep: ${reason}`)) {
      this.isLoading = true;
      this.productService.deactivateProduct(product.id, reason).subscribe({
        next: (deactivatedProduct) => {
          this.isLoading = false;
          this.snackBar.open(`'${deactivatedProduct.name}' başarıyla pasife alındı.`, 'Tamam', { duration: 3000 });
          this.loadProducts();
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(`Ürün pasife alınırken hata oluştu: ${err.message || 'Bilinmeyen Hata'}`, 'Kapat', { duration: 4000 });
          console.error('Ürün pasife alınırken hata:', err);
        }
      });
    }
  }

  reactivateProduct(product: BackendProduct): void {
    if (!product || product.id === undefined) {
      this.snackBar.open('Geçersiz ürün bilgisi.', 'Kapat', { duration: 3000 });
      return;
    }

    if (confirm(`'${product.name}' adlı ürünü tekrar yayına almak istediğinizden emin misiniz?`)) {
      this.isLoading = true;
      this.productService.reactivateProduct(product.id).pipe(
        tap((updatedProduct) => {
          this.isLoading = false;
          this.snackBar.open(`'${updatedProduct.name}' başarıyla yayına alındı.`, 'Tamam', { duration: 3000 });
          this.loadProducts();
        }),
        catchError(error => {
          this.isLoading = false;
          console.error('Error reactivating product:', error);
          this.snackBar.open(`Ürün yayına alınırken bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`, 'Kapat', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          return EMPTY;
        })
      ).subscribe();
    }
  }

  getDerivedStatus(product: BackendProduct): 'Pasif' | 'Yayında' | 'Stok Tükendi' {
    if (product.active === true) {
      return product.stockQuantity > 0 ? 'Yayında' : 'Stok Tükendi';
    }
    return 'Pasif';
  }

  getStatusClass(product: BackendProduct): string {
    const status = this.getDerivedStatus(product);
    switch (status) {
      case 'Pasif': return 'status-reddedildi';
      case 'Yayında': return 'status-yayinda';
      case 'Stok Tükendi': return 'status-stok-tukendi';
      default: return '';
    }
  }
}
