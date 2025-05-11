import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, SignupRequest } from '../../../core/services/auth.service'; // SignupRequest import edildi
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatCheckboxModule, MatIconModule,
    MatSnackBarModule, MatDividerModule, MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding: 40px 16px; box-sizing: border-box; min-height: calc(100vh - 64px); background-color: #f5f5f5; }
    .register-card { max-width: 480px; width: 100%; margin: 0 auto; background-color: white; padding: 24px 32px; border-radius: 8px; box-shadow: 0 3px 1px -2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12); }
    .register-card h2 { text-align: center; margin-bottom: 24px; font-weight: 500;}
    .mat-mdc-form-field { width: 100%; margin-bottom: 8px; }
    .submit-button-container { display: block; margin-top: 24px; margin-bottom: 16px; }
    .submit-button-container button { width: 100%; }
    .login-link-container, .switch-to-seller-container { text-align: center; margin-top: 16px; font-size: 0.9em; }
    .switch-to-seller-container { padding: 16px; margin-bottom: 24px; border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; background-color: #fafafa; }
    .switch-to-seller-container p { margin-bottom: 12px; }
    .form-intro-text { font-size: 0.9em; color: grey; margin-top: 16px; text-align: center; }
    .terms-field { margin-top: 16px; margin-bottom: 8px; }
    .terms-field a { text-decoration: none; color: #3f51b5; }
    .terms-field a:hover { text-decoration: underline; }
    .registration-success-message { text-align: center; padding: 20px; }
    .registration-success-message h3 { color: #4CAF50; margin-bottom: 16px; }
    .registration-success-message p { font-size: 1.1em; margin-bottom: 16px; }
    .registration-success-message button { margin-top: 10px; }
    .name-fields-row { display: flex; gap: 16px; }
    .name-fields-row > mat-form-field { flex: 1; }
    .form-error-message { color: #f44336; font-size: 0.75rem; padding-left: 1px; margin-top: -12px; margin-bottom: 10px; display: block; }
    @media (max-width: 599px) { .name-fields-row { flex-direction: column; gap: 0; } }
    button[type="submit"] mat-progress-spinner { display: inline-block; margin-right: 8px; }
    button[type="submit"] .mat-mdc-progress-spinner circle { stroke: white !important; }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  registrationSuccessful = false;
  private authSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', Validators.required], // Bu bilgi backend DTO'sunda yok, ama formda tutulabilir.
      lastName: ['', Validators.required],  // Bu bilgi backend DTO'sunda yok.
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });
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
      return { mismatch: true }; // Form seviyesinde de hata döndür
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.snackBar.open('Lütfen tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.value;

    const payload: SignupRequest = {
      username: formValue.username, // Formdan alınan username
      email: formValue.email,
      password: formValue.password,
    };

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.authSubscription = this.authService.registerMember(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.registrationSuccessful = true; // Başarı mesajını göster
        this.registerForm.reset();
        Object.keys(this.registerForm.controls).forEach(key => {
            this.registerForm.get(key)?.setErrors(null) ;
            this.registerForm.get(key)?.markAsPristine();
            this.registerForm.get(key)?.markAsUntouched();
        });
        this.registerForm.updateValueAndValidity();
        this.router.navigate(['/auth/login'], { queryParams: { reason: 'registration_success' } });
        console.log('Member registration successful:', response);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.registrationSuccessful = false;
        let displayErrorMessage = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        if (error.error && typeof error.error.message === 'string') {
            const backendMsg = error.error.message.toLowerCase();
            if (backendMsg.includes('username is already taken')) {
                displayErrorMessage = 'Bu kullanıcı adı zaten alınmış. Lütfen farklı bir kullanıcı adı deneyin.';
            } else if (backendMsg.includes('email is already in use')) {
                displayErrorMessage = 'Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta deneyin veya giriş yapın.';
            } else {
                displayErrorMessage = error.error.message; // Backend'den gelen diğer hatalar
            }
        } else if (error.status === 0 || error.status === 503) {
             displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        }
        this.snackBar.open(displayErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Member registration failed:', error);
      }
    });
  }

  navigateToSellerRegistrationPage(): void {
    this.router.navigate(['/auth/seller-register']);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get username() { return this.registerForm.get('username'); }
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get termsAccepted() { return this.registerForm.get('termsAccepted'); }
}
