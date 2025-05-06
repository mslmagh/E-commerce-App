// src/app/features/auth/components/seller-registration/seller-registration.component.ts
// SON HALİ (Tip hataları düzeltilmiş)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms'; // AbstractControl ve ValidationErrors eklendi
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service'; // AuthService yolunuzu kontrol edin
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse eklendi

// Angular Material Modülleri
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-seller-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatStepperModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule
  ],
  templateUrl: './seller-registration.component.html',
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 40px 16px;
      box-sizing: border-box;
      min-height: calc(100vh - 64px); /* Header yüksekliği varsayılarak */
      background-color: #f5f5f5;
    }
    .seller-register-card {
      max-width: 700px; /* Form daha geniş olabilir */
      width: 100%;
      margin: 0 auto;
      background-color: white; /* Arka planı beyaz yapalım */
      padding: 24px 32px; /* İç boşluk */
      border-radius: 8px; /* Köşeleri yuvarla */
      box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12); /* Hafif gölge */
    }
    .mat-card-header { /* Başlık için (kullanılmıyor ama stil hazır) */
      display: flex;
      justify-content: center;
      padding-bottom: 16px;
    }
    .mat-mdc-form-field, .form-field-group {
      width: 100%;
      margin-bottom: 8px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 0px;
    }
    .form-row > mat-form-field {
      flex: 1;
    }
    .actions-container {
      display: flex;
      justify-content: space-between; /* Butonları iki uca yasla */
      gap: 8px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(0,0,0,0.12);
    }
    .full-width-button {
      width: 100%;
    }
    .registration-success-message, .registration-pending-message {
      text-align: center;
      padding: 20px;
      margin-top: 20px;
    }
     .registration-success-message h3, .registration-pending-message h3 {
        color: #4CAF50; /* Başarı rengi */
        margin-bottom: 16px;
    }
     .registration-pending-message h3 {
        color: orange; /* Bekleme rengi */
     }
    .registration-success-message p, .registration-pending-message p {
        font-size: 1.1em;
        margin-bottom: 16px;
    }
     .registration-success-message button, .registration-pending-message button {
        margin-top: 10px;
    }
    .info-icon {
      font-size: 16px;
      color: grey;
      cursor: default;
    }
     /* Stepper içindeki form alanları için alt boşluk ayarı */
    .mat-horizontal-stepper-content .mat-mdc-form-field {
      margin-bottom: 16px;
    }
    /* Şifre eşleşmeme hatası için (mat-error dışında göstermek istersek) */
    .form-error-message {
      color: #f44336; /* Material warn rengi */
      font-size: 0.75rem;
      padding-left: 1px;
      margin-top: -15px;
      margin-bottom: 15px;
    }
     /* Genel Terimler Checkbox alanı */
    .terms-field {
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .terms-field a {
        text-decoration: none;
        color: #3f51b5; /* Material primary rengi */
    }
    .terms-field a:hover {
        text-decoration: underline;
    }
     /* Son onay alanı */
     .final-terms-field {
        margin-top: 8px;
        margin-bottom: 24px; /* Butondan önce boşluk */
     }

    /* Mobil için alt alta */
    @media (max-width: 599px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .seller-register-card {
          padding: 24px 16px; /* Mobilde yan boşlukları azalt */
      }
      .actions-container {
          flex-direction: column-reverse; /* Önce Gönder butonu görünsün */
          gap: 16px;
      }
      .actions-container button {
          width: 100%; /* Butonlar tam genişlik */
      }
    }
  `]
})
export class SellerRegistrationComponent implements OnInit, OnDestroy {
  sellerRegisterForm!: FormGroup;
  isLoading = false;
  applicationSubmitted = false;
  private authSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sellerRegisterForm = this.fb.group({
      storeName: ['', Validators.required],
      storeType: ['', Validators.required],
      taxNumber: [''],
      idNumber: [''],
      contactFirstName: ['', Validators.required],
      contactLastName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required, Validators.pattern("^[0-9]{10,15}$")]],
      addressLine1: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue],
      privacyPolicyAccepted: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });

    this.sellerRegisterForm.get('storeType')?.valueChanges.subscribe(type => {
      const taxNumberControl = this.sellerRegisterForm.get('taxNumber');
      const idNumberControl = this.sellerRegisterForm.get('idNumber');
      if (type === 'Şirket') {
        taxNumberControl?.setValidators([Validators.required, Validators.pattern("^[0-9]{10}$")]);
        idNumberControl?.clearValidators();
      } else if (type === 'Bireysel') {
        idNumberControl?.setValidators([Validators.required, Validators.pattern("^[1-9]{1}[0-9]{9}[02468]{1}$")]);
        taxNumberControl?.clearValidators();
      } else {
        taxNumberControl?.clearValidators();
        idNumberControl?.clearValidators();
      }
      taxNumberControl?.updateValueAndValidity();
      idNumberControl?.updateValueAndValidity();
    });
  }

  // passwordsMatchValidator metodu önceki mesajdaki gibi kalabilir (tip eklemeye gerek yok)
  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    // Eğer alanlar henüz oluşturulmadıysa veya değerleri yoksa hata yok
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }

    // Eğer şifreler eşleşmiyorsa 'mismatch' hatası döndür
    if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ ...(confirmPassword.errors || {}), 'mismatch': true }); // Mevcut hataları koruyarak ekle
        return { 'mismatch': true };
    }

    // Eşleşiyorsa ve confirmPassword'de sadece 'mismatch' hatası varsa, onu temizle
    if (confirmPassword.hasError('mismatch')) {
        const errors = { ...confirmPassword.errors }; // Hataların kopyasını al
        delete errors['mismatch']; // mismatch'i sil
        if (Object.keys(errors).length === 0) {
            confirmPassword.setErrors(null); // Başka hata kalmadıysa null yap
        } else {
            confirmPassword.setErrors(errors); // Diğer hatalar kalsın
        }
    }

    return null; // Eşleşiyorsa veya işlem yapıldıysa null döndür
  }


  onSubmit(): void {
    if (this.sellerRegisterForm.invalid) {
      this.sellerRegisterForm.markAllAsTouched();
      this.snackBar.open('Lütfen formdaki tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const { confirmPassword, ...sellerApplicationData } = this.sellerRegisterForm.value;

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    // AuthService'deki (var olduğunu varsaydığımız) metodu çağırıyoruz
    this.authSubscription = this.authService.registerSellerApplication(sellerApplicationData).subscribe({
      // TİPLER EKLENDİ:
      next: (response: any) => { // Tip olarak 'any' veya backend yanıtına uygun bir interface kullanın
        this.isLoading = false;
        this.applicationSubmitted = true;
        this.snackBar.open('Satıcı başvurunuz başarıyla alındı! Onay süreci hakkında bilgilendirileceksiniz.', 'Tamam', { duration: 7000, panelClass: ['success-snackbar'] });
        this.sellerRegisterForm.reset();
        Object.keys(this.sellerRegisterForm.controls).forEach(key => {
            this.sellerRegisterForm.get(key)?.setErrors(null) ;
            this.sellerRegisterForm.get(key)?.markAsPristine();
            this.sellerRegisterForm.get(key)?.markAsUntouched();
        });
        this.sellerRegisterForm.updateValueAndValidity();
        console.log('Seller application submitted successfully:', response);
      },
      // TİP EKLENDİ:
      error: (error: HttpErrorResponse) => { // Tip olarak HttpErrorResponse kullanın
        this.isLoading = false;
        this.applicationSubmitted = false;
        let displayErrorMessage = 'Satıcı başvurusu sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        if (error.error && typeof error.error.message === 'string') {
          displayErrorMessage = error.error.message;
        } else if (typeof error.message === 'string' && error.status !== 0 && error.status !== 503) {
           displayErrorMessage = error.message;
        } else if (error.status === 0 || error.status === 503) {
          displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        }
        this.snackBar.open(displayErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Seller application submission failed:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Form kontrollerine kolay erişim için getter'lar
  get storeName() { return this.sellerRegisterForm.get('storeName'); }
  get storeType() { return this.sellerRegisterForm.get('storeType'); }
  get taxNumber() { return this.sellerRegisterForm.get('taxNumber'); }
  get idNumber() { return this.sellerRegisterForm.get('idNumber'); }
  get contactFirstName() { return this.sellerRegisterForm.get('contactFirstName'); }
  get contactLastName() { return this.sellerRegisterForm.get('contactLastName'); }
  get contactEmail() { return this.sellerRegisterForm.get('contactEmail'); }
  get contactPhone() { return this.sellerRegisterForm.get('contactPhone'); }
  get addressLine1() { return this.sellerRegisterForm.get('addressLine1'); }
  get city() { return this.sellerRegisterForm.get('city'); }
  get postalCode() { return this.sellerRegisterForm.get('postalCode'); }
  get password() { return this.sellerRegisterForm.get('password'); }
  get confirmPassword() { return this.sellerRegisterForm.get('confirmPassword'); }
  get termsAccepted() { return this.sellerRegisterForm.get('termsAccepted'); }
  get privacyPolicyAccepted() { return this.sellerRegisterForm.get('privacyPolicyAccepted'); }
}
