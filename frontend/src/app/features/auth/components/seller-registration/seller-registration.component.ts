import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, SignupRequest } from '../../../../core/services/auth.service'; // SignupRequest import edildi
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper'; // Stepper için eklendi, ama kullanılmıyorsa kaldırılabilir.
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-seller-registration',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCheckboxModule, MatIconModule, MatStepperModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatSelectModule
  ],
  templateUrl: './seller-registration.component.html',
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding: 40px 16px; box-sizing: border-box; min-height: calc(100vh - 64px); background-color: #f5f5f5; }
    .seller-register-card { max-width: 700px; width: 100%; margin: 0 auto; background-color: white; padding: 24px 32px; border-radius: 8px; box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12); }
    .seller-register-card h2 { text-align: center; margin-bottom: 16px; font-weight: 500; }
    .seller-register-card h3 { margin-top: 24px; margin-bottom: 16px; font-size: 1.2em; border-bottom: 1px solid #eee; padding-bottom: 8px; font-weight: 500; color: #333; }
    .mat-mdc-form-field { width: 100%; margin-bottom: 8px; }
    .form-row { display: flex; gap: 16px; margin-bottom: 0px; }
    .form-row > mat-form-field { flex: 1; }
    .actions-container { display: flex; justify-content: space-between; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.12); }
    .registration-pending-message { text-align: center; padding: 30px 20px; margin-top: 20px; background-color: #fffde7; border: 1px solid #fff59d; border-radius: 4px;}
    .registration-pending-message h3 { color: #f57f17; margin-bottom: 16px; }
    .registration-pending-message p { font-size: 1.05em; margin-bottom: 16px; line-height: 1.6; }
    .registration-pending-message button { margin-top: 10px; }
    .terms-field { margin-top: 16px; margin-bottom: 8px; }
    .terms-field a { text-decoration: none; color: #3f51b5; }
    .terms-field a:hover { text-decoration: underline; }
    .form-error-message { color: #f44336; font-size: 0.75rem; padding-left: 1px; margin-top: -12px; margin-bottom: 10px; display:block; }
    @media (max-width: 599px) { .form-row { flex-direction: column; gap: 0; } .seller-register-card { padding: 24px 16px; } .actions-container { flex-direction: column-reverse; gap: 16px; } .actions-container button { width: 100%; } }
    button[type="submit"] mat-progress-spinner { display: inline-block; margin-right: 8px; }
    button[type="submit"] .mat-mdc-progress-spinner circle { stroke: white !important; }
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
      storeType: ['', Validators.required], // Bireysel, Şirket
      taxNumber: [''], // Şirket ise zorunlu
      idNumber: [''],   // Bireysel ise zorunlu
      contactFirstName: ['', Validators.required],
      contactLastName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]], // Bu, username olarak da kullanılacak
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
        idNumberControl?.setValue(''); // Değeri temizle
      } else if (type === 'Bireysel') {
        idNumberControl?.setValidators([Validators.required, Validators.pattern("^[1-9]{1}[0-9]{9}[02468]{1}$")]);
        taxNumberControl?.clearValidators();
        taxNumberControl?.setValue(''); // Değeri temizle
      } else {
        taxNumberControl?.clearValidators();
        idNumberControl?.clearValidators();
      }
      taxNumberControl?.updateValueAndValidity();
      idNumberControl?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    if (password.value === confirmPassword.value) {
      if (confirmPassword.hasError('mismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    } else {
      confirmPassword.setErrors({ ...(confirmPassword.errors || {}), mismatch: true });
      return { mismatch: true };
    }
  }

  onSubmit(): void {
    if (this.sellerRegisterForm.invalid) {
      this.sellerRegisterForm.markAllAsTouched();
      this.snackBar.open('Lütfen formdaki tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const formValue = this.sellerRegisterForm.value;

    const payload: SignupRequest = {
      username: formValue.contactEmail, // Satıcı için username = contactEmail
      email: formValue.contactEmail,
      password: formValue.password,
      role: 'ROLE_SELLER' // Rolü explicit olarak SELLER ata
    };


    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.authSubscription = this.authService.registerSeller(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.applicationSubmitted = true; // Başarı mesajını göster
        this.snackBar.open('Satıcı hesap başvurunuz alındı. Onay süreci için bilgilendirileceksiniz.', 'Tamam', { duration: 7000, panelClass: ['success-snackbar'] });
        this.sellerRegisterForm.reset();
         Object.keys(this.sellerRegisterForm.controls).forEach(key => {
            this.sellerRegisterForm.get(key)?.setErrors(null) ;
            this.sellerRegisterForm.get(key)?.markAsPristine();
            this.sellerRegisterForm.get(key)?.markAsUntouched();
        });
        this.sellerRegisterForm.updateValueAndValidity();
        console.log('Seller basic account registration submitted successfully:', response);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.applicationSubmitted = false;
        let displayErrorMessage = 'Satıcı başvurusu sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        if (error.error && typeof error.error.message === 'string') {
          const backendMsg = error.error.message.toLowerCase();
          if (backendMsg.includes('username is already taken')) {
            displayErrorMessage = 'Bu e-posta (kullanıcı adı olarak) zaten bir hesaba atanmış.';
          } else if (backendMsg.includes('email is already in use')) {
            displayErrorMessage = 'Bu e-posta adresi zaten kayıtlı.';
          } else {
            displayErrorMessage = error.error.message;
          }
        } else if (error.status === 0 || error.status === 503) {
          displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        }
        this.snackBar.open(displayErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Seller basic account registration failed:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

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
