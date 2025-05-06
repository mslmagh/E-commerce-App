// frontend/src/app/features/auth/login/login.component.ts
// SON HAL (Belirtilen 'message' kısmı düzeltilmiş ve genel yapı korunmuştur)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Yolu Kontrol Et!
import { Subscription } from 'rxjs';

// Angular Material Importları
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding-top: 50px; min-height: calc(100vh - 150px); }
    .login-form-container { max-width: 400px; width: 100%; padding: 25px 30px; box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12); border-radius: 4px; background-color: white; }
    mat-form-field { width: 100%; margin-bottom: 5px; }
    button[type="submit"] { display: block; width: 100%; padding: 10px 0; margin-top: 20px; margin-bottom: 15px; font-size: 1rem; }
    .register-link-container { text-align: center; margin-top: 20px; font-size: 14px; }
    .register-link-container a { color: #007bff; text-decoration: none; font-weight: 500; }
    .register-link-container a:hover { text-decoration: underline; }
    .info-message { padding: 10px; margin-bottom: 15px; border: 1px solid orange; background: lightyellow; color: #856404; text-align: center; border-radius: 4px; font-weight: 500; }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  infoMessage: string | null = null;
  private returnUrl: string = '/';
  isLoading: boolean = false;
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRoleAndStatus(
        this.authService.getUserRole(),
        this.authService.getAccountStatus()
      );
      return;
    }

    this.loginForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });

    this.route.queryParamMap.subscribe(params => {
        const reason = params.get('reason');
        const returnUrlFromQuery = params.get('returnUrl');

        if (reason === 'checkout_login_required') {
          this.infoMessage = 'Siparişe devam etmek için lütfen giriş yapın.';
        } else if (reason === 'session_expired') {
            this.infoMessage = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
        }

        this.returnUrl = returnUrlFromQuery || '/';
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Lütfen e-posta ve şifre alanlarını doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.authSubscription = this.authService.login(email, password).subscribe({
      next: (response) => { // response, AuthService'ten gelen LoginResponse tipinde olmalı
        this.isLoading = false;

        const userRole = this.authService.getUserRole();
        const accountStatus = this.authService.getAccountStatus();

        if (this.authService.isLoggedIn() && userRole) {
          this.snackBar.open('Giriş başarılı!', 'Kapat', { duration: 3000, panelClass: ['success-snackbar'] });
          this.redirectBasedOnRoleAndStatus(userRole, accountStatus);
        } else {
          // HTTP isteği başarılı (200 OK) olsa bile AuthService,
          // yanıtı geçerli bir login olarak kabul etmedi (örn: token/rol eksik).
          console.warn('LoginComponent: AuthService reported not logged in or no role after login attempt, despite a successful HTTP response from backend. Original backend response:', response);

          const logicalErrorMessage = 'Oturum başlatılamadı. Sunucudan beklenen bilgiler alınamadı veya eksik. Lütfen daha sonra tekrar deneyin veya sistem yöneticisi ile iletişime geçin.';

          this.snackBar.open(logicalErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
          this.authService.logout(); // Tutarsız bir durumu engellemek için logout yap
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed in component:', error);

        let displayErrorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.';

        if (error.error && typeof error.error.message === 'string') {
          const backendMsg = error.error.message.toLowerCase();
          if (backendMsg.includes('pending approval')) {
            displayErrorMessage = 'Satıcı hesabınız yönetici onayı beklemektedir.';
          } else if (backendMsg.includes('rejected')) {
            displayErrorMessage = 'Satıcı başvurunuz reddedilmiştir.';
          } else if (backendMsg.includes('disabled') || backendMsg.includes('deactivated')) {
            displayErrorMessage = 'Hesabınız devre dışı bırakılmıştır.';
          } else if (backendMsg.includes('credentials') || backendMsg.includes('unauthorized') || error.status === 401) {
            displayErrorMessage = 'E-posta veya şifre hatalı.';
          } else {
            displayErrorMessage = error.error.message;
          }
        } else if (error.status === 0 || error.status === 503) { // Sunucuya ulaşılamama veya servis yok durumu
            displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        }
        this.snackBar.open(displayErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    });
  }

  private redirectBasedOnRoleAndStatus(role: string | null, accountStatus: string | null): void {
    if (!role || !this.authService.isLoggedIn()) {
      console.warn('Redirect attempted without valid role or login status.');
      if(this.authService.isLoggedIn()) this.authService.logout();
      return;
    }

    console.log(`LoginComponent: Redirecting. Role: ${role}, Status: ${accountStatus}, Default ReturnURL: ${this.returnUrl}`);
    let targetUrl = this.returnUrl;

    if (role === 'ADMIN') {
      targetUrl = '/admin/dashboard'; // Admin her zaman admin paneline gider
    } else if (role === 'SELLER') {
      if (accountStatus === 'APPROVED') {
        targetUrl = '/seller/dashboard'; // Onaylanmış satıcı, satıcı paneline gider
      } else {
        // Onaylanmamış (PENDING_APPROVAL, REJECTED, DISABLED vb.) satıcılar için
        // onSubmit içindeki error bloğu veya next/else bloklarında zaten snackbar gösterilmiş olmalı.
        // AuthService bu durumda logout yapmış olmalı.
        if (this.authService.isLoggedIn()) { // Hala bir şekilde loginse, logout et
             this.authService.logout();
        }
        return; // Yönlendirme yapma, login sayfasında kal
      }
    } else if (role === 'MEMBER') {
      // Üye için returnUrl kullanılır (varsayılanı '/')
      // Login veya register sayfasına geri dönmesini engelle
      if (targetUrl.includes('/login') || targetUrl.includes('/register')) {
          targetUrl = '/';
      }
    } else {
      this.snackBar.open(`Tanımsız kullanıcı rolü (${role}). Yönlendirme yapılamadı.`, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
      this.authService.logout(); // Bilinmeyen rolde logout yap
      return; // Yönlendirme yapma
    }

    console.log(`LoginComponent: Navigating to ${targetUrl}`);
    this.router.navigateByUrl(targetUrl);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
