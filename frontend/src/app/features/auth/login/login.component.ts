// frontend/src/app/features/auth/login/login.component.ts
// SON HAL (Snackbar Entegrasyonu - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Yolu Kontrol Et!

// Angular Material Importları
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// Snackbar için gerekli importlar:
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule // <-- Snackbar modülü eklendi
  ],
  templateUrl: './login.component.html',
  // Inline Stiller (Öncekiyle aynı)
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding-top: 50px; min-height: calc(100vh - 150px); }
    .login-form-container { max-width: 400px; width: 100%; padding: 25px 30px; box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12); border-radius: 4px; background-color: white; }
    mat-form-field { width: 100%; margin-bottom: 5px; }
    button[type="submit"] { display: block; width: 100%; padding: 10px 0; margin-top: 20px; margin-bottom: 15px; font-size: 1rem; }
    .register-link-container { text-align: center; margin-top: 20px; font-size: 14px; }
    .register-link-container a { color: #007bff; text-decoration: none; font-weight: 500; }
    .register-link-container a:hover { text-decoration: underline; }
    /* Checkout'tan gelen mesaj veya form hata mesajı için stil */
    .info-message { padding: 10px; margin-bottom: 15px; border: 1px solid orange; background: lightyellow; color: #856404; text-align: center; border-radius: 4px; font-weight: 500; }
  `]
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  infoMessage: string | null = null; // Checkout'tan gelen mesaj için hala gerekli
  private returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar // <-- MatSnackBar enjekte edildi
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });
    this.route.queryParamMap.subscribe(params => {
        const reason = params.get('reason');
        const returnUrlFromQuery = params.get('returnUrl');
        if (reason === 'checkout_login_required') { this.infoMessage = 'Siparişe devam etmek için lütfen giriş yapın.'; }
         else { this.infoMessage = null; }
        if (returnUrlFromQuery) { this.returnUrl = returnUrlFromQuery; }
         else { this.returnUrl = '/';}
    });
  }

  onSubmit(): void {
    this.infoMessage = null; // Submit başında mesajı temizle (checkout mesajı kalabilir)

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        if (response && response.token) {
          this.authService.saveToken(response.token);
          console.log('Login successful, navigating to:', this.returnUrl);
          // Başarı mesajı Snackbar ile
          this.snackBar.open('Giriş başarılı!', 'Kapat', { duration: 3000, panelClass: ['success-snackbar'] }); // Opsiyonel CSS sınıfı
          this.router.navigateByUrl(this.returnUrl);
        } else {
          console.error('Token not found in response object:', response);
          // Hata mesajı Snackbar ile
          this.snackBar.open('Giriş başarılı ancak token alınamadı!', 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        const errorMessage = error.error?.message || error.message || 'E-posta veya şifre hatalı.';
        // Hata mesajı Snackbar ile
        this.snackBar.open(errorMessage, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
