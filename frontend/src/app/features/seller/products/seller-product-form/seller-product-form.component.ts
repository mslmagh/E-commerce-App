import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, of, Observable, EMPTY } from 'rxjs';
import { delay, catchError, tap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product, ProductService, ProductRequest } from '../../../../core/services/product.service';
import { Category as ProductCategory, CategoryService } from '../../../../core/services/category.service';

export interface ProductFormData {
  id?: string | number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string | number | null;
  imageUrl?: string;
}

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    MatIconModule, MatProgressSpinnerModule, MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './seller-product-form.component.html',
  styles: [`
    .product-form-container { max-width: 800px; margin: 20px auto; }
    mat-card { padding: 24px;}
    mat-card-title { margin-bottom: 24px; text-align: center; font-size: 1.5em; font-weight: 500; }
    .form-row { display: flex; gap: 16px; }
    .form-row > mat-form-field { flex: 1; }
    .mat-mdc-form-field { width: 100%; margin-bottom: 16px; }
    .image-upload-section { margin-bottom: 20px; border: 1px dashed #ccc; padding: 16px; border-radius: 4px; text-align:center; }
    .image-upload-section label { font-weight: 500; display: block; margin-bottom: 8px; }
    .image-preview { max-width: 150px; max-height: 150px; margin-top: 10px; border: 1px solid #eee; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;}
    .actions-container { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.12); }
    .mat-chip-list-wrapper { margin-bottom: 16px; }
    h3[matSubheader] { font-size: 1.1em; font-weight: 500; margin-top: 24px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;}
    .loading-spinner-container { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; min-height: 200px; }
     /* Genel Terimler Checkbox alanı */
    .terms-field { margin-top: 16px; margin-bottom: 8px; }
    .terms-field a { text-decoration: none; color: #3f51b5; }
    .terms-field a:hover { text-decoration: underline; }
     /* Son onay alanı */
     .final-terms-field { margin-top: 8px; margin-bottom: 24px; }
    /* Mobil için alt alta */
    @media (max-width: 599px) {
      .form-row { flex-direction: column; gap: 0; }
      .actions-container { flex-direction: column-reverse; gap: 16px; }
      .actions-container button { width: 100%; }
    }
  `]
})
export class SellerProductFormComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  isEditMode = false;
  productId: string | number | null = null;
  isLoading = false;
  categories$: Observable<ProductCategory[]> = of([]);
  private routeSubscription!: Subscription;
  private productSubscription!: Subscription;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  constructor() {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idFromRoute = params.get('productId');
      if (idFromRoute) {
        this.isEditMode = true;
        this.productId = idFromRoute;
        this.loadProductForEdit(this.productId);
        console.log('Düzenleme Modu - Ürün ID:', this.productId);
      } else {
        this.isEditMode = false;
        this.productId = null;
        this.productForm.reset();
        this.imagePreviewUrl = null;
        console.log('Yeni Ürün Ekleme Modu');
      }
    });
  }

  initForm(productData?: ProductFormData): void {
    this.productForm = this.fb.group({
      name: [productData?.name || '', Validators.required],
      description: [productData?.description || '', Validators.required],
      price: [productData?.price || null, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [productData?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
      categoryId: [productData?.categoryId?.toString() || null, Validators.required],
      imageUrl: [productData?.imageUrl || '']
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categories$ = this.categoryService.getAllCategories().pipe(
      tap(() => { if (!this.isEditMode || !this.productId) this.isLoading = false; }),
      catchError(error => {
        this.isLoading = false;
        this.snackBar.open('Kategoriler yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        console.error('Error loading categories:', error);
        return of([]);
      })
    );
  }

  loadProductForEdit(id: string | number): void {
    this.isLoading = true;
    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }
    this.productSubscription = this.productService.getProductById(id).pipe(
      tap((product: Product | undefined) => {
        if (product) {
          const productFormData: ProductFormData = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            stockQuantity: product.stockQuantity,
            categoryId: product.categoryId.toString(),
            imageUrl: product.imageUrl || ''
          };
          this.productForm.patchValue(productFormData);
          this.imagePreviewUrl = product.imageUrl || null;
        } else {
          this.snackBar.open('Düzenlenecek ürün bulunamadı.', 'Kapat', { duration: 3000 });
          this.router.navigate(['/seller/products']);
        }
        this.isLoading = false;
      }),
      catchError(error => {
        this.isLoading = false;
        console.error('Error loading product for edit:', error);
        this.snackBar.open(`Ürün yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen Hata'}`, 'Kapat', { duration: 3000 });
        this.router.navigate(['/seller/products']);
        return EMPTY;
      })
    ).subscribe();
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => { this.imagePreviewUrl = reader.result; };
      reader.readAsDataURL(this.selectedFile);
      console.log('Seçilen dosya:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Lütfen formdaki tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const formValues = this.productForm.value;
    const productRequest: ProductRequest = {
      name: formValues.name,
      description: formValues.description,
      price: formValues.price,
      stockQuantity: formValues.stockQuantity,
      categoryId: Number(formValues.categoryId),
      imageUrl: formValues.imageUrl || undefined
    };

    let apiCall: Observable<Product>;

    if (this.isEditMode && this.productId) {
      console.log('Ürün Güncelleniyor:', productRequest);
      apiCall = this.productService.updateProduct(Number(this.productId), productRequest);
    } else {
      console.log('Yeni Ürün Ekleniyor:', productRequest);
      apiCall = this.productService.createProduct(productRequest);
    }

    this.productSubscription = apiCall.pipe(
      tap((response: Product) => {
        this.isLoading = false;
        const message = this.isEditMode ? 'Ürün başarıyla güncellendi!' : 'Ürün başarıyla eklendi!';
        this.snackBar.open(message, 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigate(['/seller/products']);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || (this.isEditMode ? 'Ürün güncellenirken hata oluştu.' : 'Ürün eklenirken hata oluştu.');
        this.snackBar.open(errorMsg, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
        console.error('Product form submission error:', error);
        return EMPTY;
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.productSubscription) this.productSubscription.unsubscribe();
  }

  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get categoryId() { return this.productForm.get('categoryId'); }
  get imageUrl() { return this.productForm.get('imageUrl'); }
}
