// frontend/src/app/features/auth/register/register.component.ts
// SON HAL (AuthService Kullanımı ve Şifre Eşleşme Kontrolü Dahil - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
// AuthService'i import ediyoruz
import { AuthService } from '../../../core/services/auth.service';
 import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // veya .scss
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;

  // AuthService'i enjekte ediyoruz
  constructor(
    private authService: AuthService
    // private router: Router // İleride
  ) { }

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      'name': new FormControl(null, Validators.required),
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, [Validators.required /*, Validators.minLength(6) */]),
      'confirmPassword': new FormControl(null, Validators.required)
    },
    { validators: this.passwordsMatchValidator });

    // console.log('Initial Register Form Status:', this.registerForm.status);
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  };

  // onSubmit metodunu AuthService'i kullanacak şekilde güncelliyoruz
  onSubmit(): void {
    console.log('Register Form Submitted!');

    if (this.registerForm.invalid) {
      console.log('Form is invalid - submission prevented.');
      console.log('Form Errors:', this.registerForm.errors);
      // this.registerForm.markAllAsTouched();
      return;
    }

    console.log('Form is valid, calling authService.register...');
    const registrationData = {
       name: this.registerForm.value.name,
       email: this.registerForm.value.email,
       password: this.registerForm.value.password // Sadece asıl şifre gönderilir
    };

    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful!', response);
        alert('Kayıt Başarılı! Lütfen giriş yapın.');
        // TODO: Kullanıcıyı login sayfasına yönlendir
        // this.router.navigate(['/auth/login']);
        // this.registerForm.reset(); // Formu temizle
      },
      error: (error) => {
        console.error('Registration failed:', error);
        const errorMessage = error.error?.message || error.message || 'Kayıt sırasında bir hata oluştu.';
        alert('Kayıt Başarısız! Hata: ' + errorMessage);
        // TODO: Daha iyi hata gösterimi
      }
    });
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
