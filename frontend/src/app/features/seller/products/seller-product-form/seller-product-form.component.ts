
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, of, Observable } from 'rxjs'; // Observable import edildi
import { delay } from 'rxjs/operators'; // delay import edildi
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

 import { ProductService } from '../../../../core/services/product.service';

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
}
export interface ProductFormData {
  id?: string | number;
  name: string;
  description: string;
  sku?: string;
  price: number;
  discountedPrice?: number | null;
  stockQuantity: number;
  categoryId: string | number | null;
  brand?: string;
  tags?: string[];
  isActive: boolean;
}

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    MatCheckboxModule, MatIconModule, MatProgressSpinnerModule, MatCardModule,
    MatSlideToggleModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './seller-product-form.component.html', // HTML dosya adınızın bu olduğundan emin olun
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
  categories$: Observable<Category[]> = of([]);
  private routeSubscription!: Subscription;
  private productSubscription!: Subscription;
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('productId');
      if (id) {
        this.isEditMode = true;
        this.productId = id;
        this.loadProductForEdit(id);
        console.log('Düzenleme Modu - Ürün ID:', this.productId);
      } else {
        this.isEditMode = false;
        console.log('Yeni Ürün Ekleme Modu');
      }
    });
  }

  initForm(productData?: ProductFormData): void {
    this.productForm = this.fb.group({
      name: [productData?.name || '', Validators.required],
      description: [productData?.description || '', Validators.required],
      sku: [productData?.sku || ''],
      price: [productData?.price || null, [Validators.required, Validators.min(0.01)]],
      discountedPrice: [productData?.discountedPrice || null], // Custom validator aşağıda eklenecek
      stockQuantity: [productData?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
      categoryId: [productData?.categoryId || null, Validators.required],
      brand: [productData?.brand || ''],
      isActive: [productData ? productData.isActive : true, Validators.required]
    });

    this.productForm.get('discountedPrice')?.setValidators([
        Validators.min(0),
        (control: AbstractControl): ValidationErrors | null => {
            const priceControl = this.productForm.get('price');
            if (!priceControl) return null; // price alanı henüz formda yoksa
            const price = priceControl.value;
            if (control.value !== null && price !== null && control.value >= price) {
                return { discountedPriceTooHigh: true };
            }
            return null;
        }
    ]);
    this.productForm.get('discountedPrice')?.updateValueAndValidity(); // Validator'ı uygula
  }

  loadCategories(): void {
    this.categories$ = of([
      { id: 'cat1', name: 'Elektronik' }, { id: 'cat2', name: 'Giyim' },
      { id: 'cat3', name: 'Ev & Yaşam' }, { id: 'cat4', name: 'Kozmetik' },
      { id: 'cat5', name: 'Kitap' }
    ]).pipe(delay(500));
  }

  loadProductForEdit(id: string | number): void {
    this.isLoading = true;

    setTimeout(() => { // Simülasyon
      const mockProduct: ProductFormData = {
        id: id, name: 'Düzenlenecek Harika Ürün', description: 'Bu ürünün açıklaması düzenleniyor.',
        sku: 'EDT-001', price: 250.00, discountedPrice: 225.00, stockQuantity: 42, categoryId: 'cat1',
        brand: 'Harika Marka', isActive: false, tags: ['düzenleme', 'test']
      };
      this.initForm(mockProduct); // Formu mockProduct ile başlat/güncelle
      this.isLoading = false;
    }, 1000);
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
    const formValues: ProductFormData = this.productForm.value;

    let apiCall: Observable<any>;

    if (this.isEditMode && this.productId) {
      formValues.id = this.productId;
      console.log('Ürün Güncelleniyor:', formValues);
      apiCall = of({ success: true, message: 'Ürün başarıyla güncellendi (simülasyon)!' }).pipe(delay(1000));
    } else {
      console.log('Yeni Ürün Ekleniyor:', formValues);
      apiCall = of({ success: true, message: 'Ürün başarıyla eklendi (simülasyon)!' }).pipe(delay(1000));
    }

    apiCall.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open(response?.message || (this.isEditMode ? 'Ürün güncellendi!' : 'Ürün eklendi!'), 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigate(['/seller/products']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || (this.isEditMode ? 'Ürün güncellenirken hata oluştu.' : 'Ürün eklenirken hata oluştu.');
        this.snackBar.open(errorMsg, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
        console.error('Product form submission error:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.productSubscription) this.productSubscription.unsubscribe();
  }

  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get discountedPrice() { return this.productForm.get('discountedPrice'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get categoryId() { return this.productForm.get('categoryId'); }
  get isActive() { return this.productForm.get('isActive'); }
}
