import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AddressService } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environment';
import { AddressDto } from '../../../core/models/dto/address.dto';
import { AddressRequestDto } from '../../../core/models/dto/address-request.dto';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './address-form.component.html',
  styles: [`
    .address-form-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .form-card {
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .action-buttons {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 50px 0;
    }
    .error-message {
      color: #f44336;
      margin: 10px 0;
      padding: 10px;
      background-color: #ffeaea;
      border-radius: 4px;
    }
    .debug-info {
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background-color: #f5f5f5;
      font-family: monospace;
      white-space: pre-wrap;
    }
  `]
})
export class AddressFormComponent implements OnInit {
  addressForm!: FormGroup;
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  addressId?: number;
  error: string | null = null;
  formSubmitted = false;
  showDebug = false; // Set to true to show debug info in UI
  originalAddress: AddressDto | null = null;
  apiUrl = environment.apiUrl; // Make apiUrl accessible in template

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Bu sayfayı görüntülemek için giriş yapmalısınız.', 'Giriş Yap', { 
        duration: 5000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: this.router.url } 
        });
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initForm();
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.addressId = +id;
        this.isEditMode = true;
        this.loadAddressDetails(this.addressId);
      }
    });
  }

  initForm(): void {
    this.addressForm = this.fb.group({
      phoneNumber: ['', [Validators.required]],
      country: ['Türkiye', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      addressText: ['', [Validators.required]]
    });
  }

  loadAddressDetails(id: number): void {
    this.isLoading = true;
    this.error = null;
    
    this.addressService.getAddressById(id).subscribe({
      next: (address) => {
        console.log('Loaded address details for edit:', address);
        this.originalAddress = address;
        this.addressForm.patchValue({
          phoneNumber: address.phoneNumber || '',
          country: address.country || 'Türkiye',
          city: address.city || '',
          postalCode: address.postalCode || '',
          addressText: address.addressText || ''
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading address details:', err);
        this.isLoading = false;
        this.error = err.message || 'Adres bilgileri yüklenemedi.';
        this.snackBar.open('Adres bilgileri yüklenemedi. ' + this.error, 'Kapat', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        
        // Wait a bit before navigating away
        setTimeout(() => {
          this.router.navigate(['/profile/addresses']);
        }, 2000);
      }
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    Object.keys(this.addressForm.controls).forEach(key => {
      const control = this.addressForm.get(key);
      if (control && typeof control.value === 'string') {
        control.setValue(control.value.trim());
      }
    });
    
    console.log('[AddressForm] Form submitted. Values:', this.addressForm.value);
    console.log('[AddressForm] Form validity:', this.addressForm.valid);

    if (this.addressForm.invalid) {
      Object.keys(this.addressForm.controls).forEach(key => {
        this.addressForm.get(key)?.markAsTouched();
      });
      this.snackBar.open('Lütfen tüm zorunlu alanları doldurun.', 'Tamam', { duration: 3000 });
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Bu işlemi gerçekleştirmek için giriş yapmalısınız.', 'Giriş Yap', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: this.router.url } 
        });
      });
      return;
    }

    const addressData: AddressRequestDto = this.addressForm.value;

    for (const [key, value] of Object.entries(addressData)) {
      if (value === null || value === undefined || String(value).trim() === '') {
        this.snackBar.open(`Alan boş olamaz: ${key}`, 'Tamam', { duration: 3000 });
        return;
      }
    }
    
    console.log('[AddressForm] AddressData to be sent (after frontend validation):', addressData);

    this.isSubmitting = true;
    this.error = null;

    if (this.isEditMode && this.addressId) {
      this.addressService.updateAddress(this.addressId, addressData).subscribe({
        next: (response) => {
          console.log('Address update successful via service:', response);
          this.isSubmitting = false;
          this.snackBar.open('Adres başarıyla güncellendi.', 'Tamam', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/profile/addresses']);
        },
        error: (err) => { 
          console.error('Error updating address via service:', err);
          this.isSubmitting = false;
          this.error = err.message || 'Adres güncellenirken bir hata oluştu.';
          this.snackBar.open(this.error ?? 'Adres güncellenirken bir sorun oluştu. Lütfen tekrar deneyin.', 'Kapat', {
            duration: 7000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.addressService.createAddress(addressData).subscribe({
        next: (response) => {
          console.log('Server response (create):', response);
          this.isSubmitting = false;
          this.snackBar.open('Yeni adres başarıyla eklendi.', 'Tamam', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/profile/addresses']);
        },
        error: (err) => {
          console.error('Error saving address (create):', err);
          this.isSubmitting = false;
          this.error = err.message || 'Adres kaydedilirken bir hata oluştu.';
          this.snackBar.open('Adres kaydedilirken bir hata oluştu. Detay: ' + this.error, 'Kapat', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/profile/addresses']);
  }
} 