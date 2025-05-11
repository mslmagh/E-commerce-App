import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, of, Observable, throwError } from 'rxjs';
import { delay, catchError, tap, map } from 'rxjs/operators';
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

import { CategoryService, Category } from '../../../../core/services/category.service';
import { ProductService, Product, ProductRequest } from '../../../../core/services/product.service';
import { AdminUserService, AdminUserView } from '../../services/admin-user.service';

export interface AdminProductFormData {
  id?: string | number; // Düzenleme modunda olacak
  name: string;
  description: string;
  sku?: string;
  price: number;
  discountedPrice?: number | null;
  stockQuantity: number;
  categoryId: string | number | null; // Admin tüm kategorilere erişebilir
  brand?: string;
  tags?: string[]; // İsteğe bağlı etiketler
  isActive: boolean; // Ürünün yayında olup olmadığı
  sellerId?: string | number | null; // Hangi satıcıya ait olduğu
  adminStatus: 'Onay Bekliyor' | 'Yayında' | 'Reddedildi'; // Admin onay durumu
  imageUrl: string;
}

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    MatCheckboxModule, MatIconModule, MatProgressSpinnerModule, MatCardModule,
    MatSlideToggleModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './admin-product-form.component.html',
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
    /* Mobil için alt alta */
    @media (max-width: 599px) {
      .form-row { flex-direction: column; gap: 0; }
      .actions-container { flex-direction: column-reverse; gap: 16px; }
      .actions-container button { width: 100%; }
    }
  `]
})
export class AdminProductFormComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  isEditMode = false;
  productId: string | number | null = null;
  isLoading = false;
  categories$: Observable<Category[]> = of([]); // Kategoriler için Observable
  sellers$: Observable<{ id: string | number, name: string }[]> = of([]); // Admin'e özel
  private routeSubscription!: Subscription;
  private productSubscription!: Subscription;

  adminStatuses: ('Onay Bekliyor' | 'Yayında' | 'Reddedildi')[] = ['Onay Bekliyor', 'Yayında', 'Reddedildi'];


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private categoryService: CategoryService,
    private productService: ProductService,
    private adminUserService: AdminUserService
  ) {}

  ngOnInit(): void {
    this.initForm(); // Formu başlat
    this.loadCategories(); // Kategorileri yükle
    this.loadSellers(); // Satıcıları yükle (Admin'e özel)

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('productId');
      if (id) {
        this.isEditMode = true;
        this.productId = id;
        this.loadProductForEdit(id); // Ürünü düzenleme için yükle
        console.log('Admin Product Form: Düzenleme Modu - Ürün ID:', this.productId);
      } else {
        this.isEditMode = false;
        console.log('Admin Product Form: Yeni Ürün Ekleme Modu');
      }
    });
  }

  initForm(productData?: AdminProductFormData | Product): void {
    const isProductType = productData && typeof (productData as Product).isActive !== 'undefined';
    const initialIsActive = isProductType ? (productData as Product).isActive : (productData as AdminProductFormData)?.isActive;
    const initialSellerId = (isProductType ? (productData as Product).sellerId : (productData as AdminProductFormData)?.sellerId) || null;
    const initialImageUrl = (isProductType ? (productData as Product).imageUrl : (productData as AdminProductFormData)?.imageUrl) || '';

    this.productForm = this.fb.group({
      name: [productData?.name || '', Validators.required],
      description: [productData?.description || '', Validators.required],
      sku: [(productData as AdminProductFormData)?.sku || ''],
      price: [productData?.price || null, [Validators.required, Validators.min(0.01)]],
      discountedPrice: [(productData as AdminProductFormData)?.discountedPrice || null, [Validators.min(0)]],
      stockQuantity: [productData?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
      categoryId: [productData?.categoryId || null, Validators.required],
      brand: [(productData as AdminProductFormData)?.brand || ''],
      sellerId: [initialSellerId, Validators.required],
      adminStatus: [(productData as AdminProductFormData)?.adminStatus || 'Onay Bekliyor', Validators.required],
      isActive: [initialIsActive !== undefined ? initialIsActive : true, Validators.required],
      imageUrl: [initialImageUrl, [Validators.pattern('(https?://.*\\.(?:png|jpg|jpeg|gif|svg|webp))')]]
    });

    this.productForm.get('discountedPrice')?.setValidators([
        Validators.min(0),
        (control: AbstractControl): ValidationErrors | null => {
            const priceControl = this.productForm.get('price');
            if (!priceControl) return null;
            const price = priceControl.value;
            if (control.value !== null && price !== null && control.value !== '' && price !== '' && Number(control.value) >= Number(price)) {
                return { discountedPriceTooHigh: true };
            }
            return null;
        }
    ]);
    this.productForm.get('price')?.valueChanges.subscribe(() => {
        this.productForm.get('discountedPrice')?.updateValueAndValidity();
    });
    this.productForm.get('discountedPrice')?.updateValueAndValidity(); // İlk açılışta da çalıştır
  }

  loadCategories(): void {
    this.isLoading = true; // Kategori yüklenirken de spinner gösterilebilir
    this.categories$ = this.categoryService.getAllCategories().pipe(
      tap(categories => {
        console.log('Admin Product Form: Kategoriler yüklendi', categories);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Admin Product Form: Kategori yüklenirken hata:', error);
        this.snackBar.open('Kategoriler yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.isLoading = false;
        return of([]); // Hata durumunda boş dizi döndür
      })
    );
  }

  loadSellers(): void {
    this.isLoading = true; // Satıcılar yüklenirken de spinner gösterilebilir
    this.sellers$ = this.adminUserService.getUsers().pipe(
      map(users => users.filter(user => user.roles && user.roles.has('ROLE_SELLER')) // ROLE_SELLER varsayımıyla filtreleme
        .map(sellerUser => ({ id: sellerUser.id, name: sellerUser.username })) // Forma uygun hale getirme
      ),
      tap(sellers => {
        console.log('Admin Product Form: Satıcılar yüklendi (filtrelenmiş):', sellers);
        this.isLoading = false;
        if (sellers.length === 0) {
          this.snackBar.open('Uygun rol (ROLE_SELLER) ile satıcı bulunamadı.', 'Kapat', { duration: 3500 });
        }
      }),
      catchError(error => {
        console.error('Admin Product Form: Satıcılar yüklenirken hata:', error);
        this.snackBar.open('Satıcılar yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.isLoading = false;
        return of([]); // Hata durumunda boş dizi döndür
      })
    );
  }

  loadProductForEdit(id: string | number): void {
    this.isLoading = true;
    this.productSubscription = this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          const formData: AdminProductFormData = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            sku: '',
            price: product.price,
            discountedPrice: null,
            stockQuantity: product.stockQuantity,
            categoryId: product.categoryId,
            brand: '',
            sellerId: product.sellerId || null,
            adminStatus: 'Yayında',
            isActive: product.isActive !== undefined ? product.isActive : true,
            imageUrl: product.imageUrl || ''
          };
          this.initForm(formData);
          console.log('Admin Product Form: Product loaded for edit from DTO:', product);
        } else {
          this.snackBar.open(`Ürün ID ${id} bulunamadı.`, 'Kapat', { duration: 3000 });
          this.router.navigate(['/admin/products']); // Ürün bulunamazsa listeye dön
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Admin Product Form: Ürün yüklenirken hata:', error);
        this.snackBar.open('Ürün yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/admin/products']);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Lütfen formdaki tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      console.warn('Admin Product Form: Form is invalid', this.productForm.errors, this.productForm.value);
      Object.keys(this.productForm.controls).forEach(key => {
        const controlErrors = this.productForm.get(key)?.errors;
        if (controlErrors != null) {
          console.warn('Hatalı kontrol:', key, controlErrors);
        }
      });
      return;
    }

    this.isLoading = true;
    const formValues = this.productForm.value;

    const productRequestData: ProductRequest = {
      name: formValues.name,
      description: formValues.description,
      price: formValues.price,
      stockQuantity: formValues.stockQuantity,
      categoryId: formValues.categoryId,
      sellerId: formValues.sellerId,
      imageUrl: formValues.imageUrl || undefined
    };

    console.log('Admin Product Form: Form submitted. Values:', formValues);
    console.log('Admin Product Form: ProductRequest Data (backend uyumlu):', productRequestData);

    let apiCall: Observable<Product | undefined>;

    if (this.isEditMode && this.productId) {
      console.log('Admin Product Form: Ürün Güncelleniyor:', this.productId, productRequestData);
      const numProductId = typeof this.productId === 'string' ? parseInt(this.productId, 10) : this.productId;
      if (isNaN(numProductId)) {
         this.snackBar.open('Geçersiz Ürün ID.', 'Kapat', { duration: 3000 });
         this.isLoading = false;
         return;
      }
      apiCall = this.productService.updateProduct(numProductId, productRequestData);
    } else {
      console.log('Admin Product Form: Yeni Ürün Ekleniyor:', productRequestData);
      apiCall = this.productService.createProduct(productRequestData);
    }

    this.productSubscription = apiCall.pipe(
      catchError((error: HttpErrorResponse) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || error.message || (this.isEditMode ? 'Ürün güncellenirken hata oluştu.' : 'Ürün eklenirken hata oluştu.');
        this.snackBar.open(errorMsg, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
        console.error('Admin Product Form: Submission error:', error);
        return throwError(() => new Error(errorMsg));
      })
    ).subscribe({
      next: (response: Product | undefined) => {
        this.isLoading = false;
        if (response) {
            const successMsg = this.isEditMode ? `Ürün "${response.name}" başarıyla güncellendi!` : `Yeni ürün "${response.name}" başarıyla eklendi!`;
            this.snackBar.open(successMsg, 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
            this.router.navigate(['/admin/products']);
        } else if (!this.isEditMode) {
             this.snackBar.open('Yeni ürün başarıyla eklendi!', 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
             this.router.navigate(['/admin/products']);
        }
      },
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.productSubscription) this.productSubscription.unsubscribe();
  }

   getDiscountedPriceError(): string {
       const discountedPriceControl = this.productForm.get('discountedPrice');
       if (discountedPriceControl?.hasError('min')) {
           return 'İndirimli fiyat negatif olamaz.';
       }
       if (discountedPriceControl?.hasError('discountedPriceTooHigh')) {
           return 'İndirimli fiyat, normal fiyattan düşük olmalıdır.';
       }
       return ''; // Başka hata yoksa boş döndür
   }


  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get discountedPrice() { return this.productForm.get('discountedPrice'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get categoryId() { return this.productForm.get('categoryId'); }
  get brand() { return this.productForm.get('brand'); }
  get sellerId() { return this.productForm.get('sellerId'); }
  get adminStatus() { return this.productForm.get('adminStatus'); }
  get isActive() { return this.productForm.get('isActive'); }
  get imageUrl() { return this.productForm.get('imageUrl'); }
}
