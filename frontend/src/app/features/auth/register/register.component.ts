// frontend/src/app/features/auth/register/register.component.ts
// SON HAL (Angular Material Entegrasyonu - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Yolu Kontrol Et!

// Angular Material Modülleri
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Opsiyonel

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
    MatIconModule // Opsiyonel
  ],
  templateUrl: './register.component.html',
  // styleUrls: ['./register.component.css'] // Eski CSS yerine inline stil
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 50px; /* Yukarıdan boşluk */
      padding-bottom: 50px; /* Alttan da boşluk */
      min-height: calc(100vh - 150px);
    }
    .register-form-container {
      max-width: 450px; /* Login'den biraz daha geniş olabilir */
      width: 100%;
      padding: 25px 30px;
       box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                   0px 1px 1px 0px rgba(0, 0, 0, 0.14),
                   0px 1px 3px 0px rgba(0, 0, 0, 0.12);
       border-radius: 4px;
       background-color: white;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 5px;
    }
    /* Form seviyesi hata mesajı için stil (örn: şifre eşleşmiyor) */
    .form-error-message {
        color: #dc3545; /* Kırmızı */
        font-size: 0.75rem; /* mat-error ile aynı boyutta */
        margin-top: -10px; /* Alanın altına yakın */
        margin-bottom: 15px;
        text-align: left;
        display: block;
     }
    button[type="submit"] {
      display: block;
      width: 100%;
      padding: 10px 0;
      margin-top: 20px;
      margin-bottom: 15px;
      font-size: 1rem;
    }
    .login-link-container {
       text-align: center;
       margin-top: 20px;
       font-size: 14px;
    }
    .login-link-container a {
       color: #007bff;
       text-decoration: none;
       font-weight: 500;
    }
     .login-link-container a:hover {
       text-decoration: underline;
     }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router
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
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  };

  onSubmit(): void {
    console.log('Register Form Submitted!');
    if (this.registerForm.invalid) {
      console.log('Form is invalid');
      console.log('Form Errors:', this.registerForm.errors);
      this.registerForm.markAllAsTouched();
      return;
    }
    console.log('Form is valid, calling authService.register...');
    const registrationData = {
       name: this.registerForm.value.name,
       email: this.registerForm.value.email,
       password: this.registerForm.value.password
    };
    console.log('Form Values (to send):', registrationData);
    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful!', response);
        alert('Kayıt Başarılı! Lütfen giriş yapın.');
        this.router.navigate(['/auth/login']); // Kayıt sonrası Login'e yönlendir
      },
      error: (error) => {
        console.error('Registration failed:', error);
        const errorMessage = error.error?.message || error.message || 'Kayıt sırasında bir hata oluştu.';
        alert('Kayıt Başarısız! Hata: ' + errorMessage);
      }
    });
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
