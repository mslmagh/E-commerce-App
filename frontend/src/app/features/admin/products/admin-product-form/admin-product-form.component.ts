import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
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
}

export interface Category {
  id: string | number;
  name: string;
  slug?: string;
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
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  adminStatuses: ('Onay Bekliyor' | 'Yayında' | 'Reddedildi')[] = ['Onay Bekliyor', 'Yayında', 'Reddedildi'];


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
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

  initForm(productData?: AdminProductFormData): void {
    this.productForm = this.fb.group({
      name: [productData?.name || '', Validators.required],
      description: [productData?.description || '', Validators.required],
      sku: [productData?.sku || ''],
      price: [productData?.price || null, [Validators.required, Validators.min(0.01)]],
      discountedPrice: [productData?.discountedPrice || null, [Validators.min(0)]], // İndirimli fiyat
      stockQuantity: [productData?.stockQuantity || 0, [Validators.required, Validators.min(0)]],
      categoryId: [productData?.categoryId || null, Validators.required],
      brand: [productData?.brand || ''],
      sellerId: [productData?.sellerId || null, Validators.required], // Ürünü bir satıcıya ata
      adminStatus: [productData?.adminStatus || 'Onay Bekliyor', Validators.required], // Ürün onay durumu
      isActive: [productData ? productData.isActive : true, Validators.required], // Ürünün yayında olup olmadığı
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
    this.categories$ = of([ // Mock kategoriler
      { id: 'cat1', name: 'Elektronik' }, { id: 'cat2', name: 'Giyim' },
      { id: 'cat3', name: 'Ev & Yaşam' }, { id: 'cat4', name: 'Kozmetik' },
      { id: 'cat5', name: 'Kitap' }
    ]).pipe(delay(500));
  }

  loadSellers(): void {
     this.sellers$ = of([ // Mock satıcılar
       { id: 'seller1', name: 'Örnek Satıcı A' },
       { id: 'seller2', name: 'Diğer Mağaza' },
       { id: 'seller3', name: 'Butik Dükkan' },
     ]).pipe(delay(700));
  }

  loadProductForEdit(id: string | number): void {
    this.isLoading = true;

    setTimeout(() => {
      const mockProduct: AdminProductFormData = {
        id: id, name: `Admin Tarafından Düzenlenen Ürün ${id}`, description: 'Bu ürün admin tarafından yönetiliyor.',
        sku: `ADM-${id}-SKU`, price: 300.50, discountedPrice: 270.00, stockQuantity: 55, categoryId: 'cat1',
        brand: 'Global Marka', isActive: true, sellerId: 'seller1', adminStatus: 'Yayında'
      };
      this.initForm(mockProduct); // Formu yüklenen veriyle başlat/güncelle
      this.isLoading = false;
       console.log('Admin Product Form: Düzenleme için mock ürün yüklendi:', mockProduct);
    }, 1000);
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = () => { this.imagePreviewUrl = reader.result; };
      reader.readAsDataURL(this.selectedFile);
      console.log('Admin Product Form: Seçilen dosya:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
    }
  }


  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Lütfen formdaki tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      console.warn('Admin Product Form: Form is invalid', this.productForm.errors);
      return;
    }

    this.isLoading = true;
    const formValues: AdminProductFormData = this.productForm.value;

    console.log('Admin Product Form: Form submitted. Values:', formValues);
    if (this.selectedFile) {
       console.log('Admin Product Form: Selected file:', this.selectedFile.name);
    }


    let apiCall: Observable<any>;

    if (this.isEditMode && this.productId) {
      formValues.id = this.productId; // Düzenleme modunda ID'yi ekle
      console.log('Admin Product Form: Ürün Güncelleniyor (Simülasyon):', formValues);
      apiCall = of({ success: true, message: 'Ürün başarıyla güncellendi (simülasyon)!' }).pipe(delay(1000));
    } else {
      console.log('Admin Product Form: Yeni Ürün Ekleniyor (Simülasyon):', formValues);
      apiCall = of({ success: true, message: 'Yeni ürün başarıyla eklendi (simülasyon)!' }).pipe(delay(1000));
    }

    apiCall.subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open(response?.message || (this.isEditMode ? 'Ürün güncellendi!' : 'Ürün eklendi!'), 'Tamam', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigate(['/admin/products']); // Başarılı olunca ürün listesine dön
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || (this.isEditMode ? 'Ürün güncellenirken hata oluştu.' : 'Ürün eklenirken hata oluştu.');
        this.snackBar.open(errorMsg, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
        console.error('Admin Product Form: Submission error:', error);
      }
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
  get sellerId() { return this.productForm.get('sellerId'); } // Admin'e özel
  get adminStatus() { return this.productForm.get('adminStatus'); } // Admin'e özel
  get isActive() { return this.productForm.get('isActive'); }
}
