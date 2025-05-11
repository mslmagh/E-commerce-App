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
import { CategoryService, Category } from '../../../core/services/category.service';
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

  generateSlug(name: string): string {
    if (!name) return '';
    const turkishMap: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U'
    };

    return name
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => turkishMap[match] || match)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/&/g, 've')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  ngOnInit(): void {
    console.log('ProductListComponent ngOnInit');
    this.isLoading = true;
    this.products$ = this.route.paramMap.pipe(
      switchMap(params => {
        const categorySlugFromRoute = params.get('categorySlug');
        console.log('ProductListComponent: categorySlug from route:', categorySlugFromRoute);
        
        if (categorySlugFromRoute) {
          this.categoryTitle = this.formatCategoryTitle(categorySlugFromRoute); 
          
          return this.categoryService.getAllCategories().pipe(
            switchMap((categories: Category[]) => {
              const category = categories.find(cat => 
                this.generateSlug(cat.name) === categorySlugFromRoute.toLowerCase()
              );
              
              if (category) {
                this.categoryTitle = category.name; 
                console.log(`ProductListComponent: Found category by slug: ${category.name}, ID: ${category.id}`);
                return this.productService.getProductsByCategory(category.id).pipe(
                  tap(() => this.isLoading = false),
                  catchError(err => {
                    this.isLoading = false;
                    this.snackBar.open('Ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
                    console.error('Error fetching products by category ID ' + category.id, err);
                    return of([]);
                  })
                );
              } else {
                console.warn(`ProductListComponent: Category not found for slug '${categorySlugFromRoute}'. Displaying all products or implementing specific logic.`);
                this.categoryTitle = 'Kategori Bulunamadı';
                this.isLoading = false;
                return this.productService.getProducts().pipe(
                  map(products => products.filter(product => 
                    product.categoryName ? this.generateSlug(product.categoryName) === categorySlugFromRoute.toLowerCase() : false
                  )),
                  tap(() => this.isLoading = false),
                  catchError(err => {
                    this.isLoading = false;
                    this.snackBar.open('Ürünler yüklenirken hata oluştu (fallback).', 'Kapat', {duration: 3000});
                    console.error(err);
                    return of([]);
                  })
                );
              }
            }),
            catchError(err => {
                this.isLoading = false;
                this.snackBar.open('Kategoriler yüklenirken bir hata oluştu.', 'Kapat', {duration: 3000});
                console.error('Error fetching categories in ProductListComponent', err);
                return of([]);
            })
          );
        } else {
          this.categoryTitle = 'Tüm Ürünler';
          return this.productService.getProducts().pipe(
            tap(() => this.isLoading = false),
            catchError(err => {
              this.isLoading = false;
              this.snackBar.open('Tüm ürünler yüklenirken hata oluştu.', 'Kapat', {duration: 3000});
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
