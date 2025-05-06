// frontend/src/app/features/auth/register/register.component.ts
// SON HAL (Snackbar Entegrasyonu - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Yolu Kontrol Et!

// Angular Material Modülleri
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// Snackbar için gerekli importlar:
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    // Material Modülleri:
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule // <-- Snackbar modülü eklendi
  ],
  templateUrl: './register.component.html',
  // Inline Stiller (Öncekiyle aynı)
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding-top: 50px; padding-bottom: 50px; min-height: calc(100vh - 150px); }
    .register-form-container { max-width: 450px; width: 100%; padding: 25px 30px; box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12); border-radius: 4px; background-color: white; }
    mat-form-field { width: 100%; margin-bottom: 5px; }
    .form-error-message { color: #dc3545; font-size: 0.75rem; margin-top: -10px; margin-bottom: 15px; text-align: left; display: block; }
    button[type="submit"] { display: block; width: 100%; padding: 10px 0; margin-top: 20px; margin-bottom: 15px; font-size: 1rem; }
    .login-link-container { text-align: center; margin-top: 20px; font-size: 14px; }
    .login-link-container a { color: #007bff; text-decoration: none; font-weight: 500; }
    .login-link-container a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  // formMessage: string | null = null; // Form geneli mesaj için bu kullanılabilir

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar // <-- MatSnackBar enjekte edildi
  ) { }

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      'name': new FormControl(null, Validators.required),
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, [Validators.required /*, Validators.minLength(6) */]),
      'confirmPassword': new FormControl(null, Validators.required)
    },
    { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) { return null; }
    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  };

  onSubmit(): void {
    // this.formMessage = null;

    if (this.registerForm.invalid) {
      console.log('Register Form is invalid');
      this.registerForm.markAllAsTouched();
      return;
    }

    console.log('Register Form is valid, calling authService.register...');
    const registrationData = {
       name: this.registerForm.value.name,
       email: this.registerForm.value.email,
       password: this.registerForm.value.password
    };

    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful!', response);
         // Başarı mesajı Snackbar ile
        this.snackBar.open('Kayıt Başarılı! Lütfen giriş yapın.', 'Tamam', { duration: 3500, panelClass: ['success-snackbar'] }); // 'Tamam' butonu eklendi
        this.router.navigate(['/auth/login']); // Kayıt sonrası Login'e yönlendir
      },
      error: (error) => {
        console.error('Registration failed:', error);
        const errorMessage = error.error?.message || error.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
         // Hata mesajı Snackbar ile
        this.snackBar.open(errorMessage, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
