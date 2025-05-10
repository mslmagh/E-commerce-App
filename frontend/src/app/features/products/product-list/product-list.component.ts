import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { Product, ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../../core/services/category.service';
import { CartItemRequest } from '../../../core/models/cart-item-request.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatSnackBarModule,
    MatButtonModule,
    ProductCardComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products$: Observable<Product[]> = of([]);
  categoryTitle: string = 'Tüm Ürünler';
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('ProductListComponent ngOnInit');
    this.isLoading = true;
    this.products$ = this.route.paramMap.pipe(
      switchMap(params => {
        const categorySlug = params.get('categorySlug');
        console.log('ProductListComponent: categorySlug from route:', categorySlug);
        
        if (categorySlug) {
          this.categoryTitle = this.formatCategoryTitle(categorySlug);
          
          // Önce kategorileri getirerek slug'a göre filtreleme yapacağız
          return this.categoryService.getAllCategories().pipe(
            switchMap(categories => {
              // Slug'ı kategori adına (kebab-case'den normale) dönüştür ve eşleşen kategoriyi bul
              const category = categories.find(cat => 
                cat.name.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
              );
              
              if (category) {
                // Kategori ID'si ile ürünleri getir
                return this.productService.getProductsByCategory(category.id).pipe(
                  tap(() => this.isLoading = false),
                  catchError(err => {
                    this.isLoading = false;
                    this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
                    console.error(err);
                    return of([]);
                  })
                );
              } else {
                // Kategori bulunamadıysa tüm ürünleri getir ve istemci tarafında filtreleme yap
                return this.productService.getProducts().pipe(
                  map(products => products.filter(product => 
                    product.categoryName?.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
                  )),
                  tap(() => this.isLoading = false),
                  catchError(err => {
                    this.isLoading = false;
                    this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
                    console.error(err);
                    return of([]);
                  })
                );
              }
            })
          );
        } else {
          this.categoryTitle = 'Tüm Ürünler';
          return this.productService.getProducts().pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
              console.error(err);
              return of([]);
            })
          );
        }
      })
    );
  }

  formatCategoryTitle(slug: string): string {
    if (!slug) return 'Tüm Ürünler';
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  addToCart(product: Product | undefined | null): void {
    if (product) {
      if (product.stockQuantity !== undefined && product.stockQuantity < 1) {
        this.snackBar.open(`'${product.name}' stokta bulunmamaktadır!`, 'Kapat', {
          duration: 3000, panelClass: ['warning-snackbar']
        });
        return;
      }
      console.log(`${this.constructor.name}: Adding product to cart:`, product.name);
      
      const itemRequest: CartItemRequest = { 
        productId: product.id,
        quantity: 1 // Default quantity to add
      };

      // Call the updated CartService method
      this.cartService.addItem(itemRequest, product).subscribe({
        next: (cart) => {
          this.snackBar.open(`'${product.name}' sepete eklendi`, 'Tamam', {
            duration: 2500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (err) => {
          console.error(`${this.constructor.name}: Error adding product to cart -`, err);
          this.snackBar.open(err.message || "Ürün sepete eklenemedi!", 'Kapat', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });

    } else {
      console.error(`${this.constructor.name}: Cannot add null/undefined product to cart.`);
      this.snackBar.open("Ürün sepete eklenemedi!", 'Kapat', {
         duration: 3000,
         panelClass: ['error-snackbar']
        });
    }
  }
}
