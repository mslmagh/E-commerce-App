import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService, JwtResponse } from '../../../core/services/auth.service'; // JwtResponse import edildi
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


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
    MatSnackBarModule,
    MatProgressSpinnerModule // Yükleme göstergesi için
  ],
  templateUrl: './login.component.html',
  styles: [`
    :host { display: flex; justify-content: center; align-items: flex-start; padding-top: 50px; min-height: calc(100vh - 150px); background-color: #f5f5f5; }
    .login-form-container { max-width: 400px; width: 100%; padding: 25px 30px; box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12); border-radius: 4px; background-color: white; }
    .login-form-container h2 { text-align: center; margin-bottom: 24px; font-weight: 500; }
    mat-form-field { width: 100%; margin-bottom: 5px; }
    button[type="submit"] { display: block; width: 100%; padding: 10px 0; margin-top: 20px; margin-bottom: 15px; font-size: 1rem; }
    .register-link-container { text-align: center; margin-top: 20px; font-size: 14px; }
    .register-link-container a { color: #3f51b5; text-decoration: none; font-weight: 500; }
    .register-link-container a:hover { text-decoration: underline; }
    .info-message { padding: 12px 15px; margin-bottom: 20px; border: 1px solid #ffc107; background: #fff3cd; color: #664d03; text-align: center; border-radius: 4px; font-weight: 500; font-size: 0.9em; }
    /* Spinner'ı buton içinde ortalamak ve küçültmek için */
    button[type="submit"] mat-progress-spinner {
      display: inline-block;
      margin-right: 8px;
      /* stroke: white !important; // Eğer butonun primary rengi koyuysa */
    }
     button[type="submit"] .mat-mdc-progress-spinner circle { /* Buton içindeki spinner için */
       stroke: white !important; /* Eğer buton primary ve yazı beyazsa */
     }
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
      'username': new FormControl(null, Validators.required),
      'password': new FormControl(null, Validators.required)
    });

    this.route.queryParamMap.subscribe(params => {
        const reason = params.get('reason');
        const returnUrlFromQuery = params.get('returnUrl');

        if (reason === 'checkout_login_required') {
          this.infoMessage = 'Siparişe devam etmek için lütfen giriş yapın.';
        } else if (reason === 'session_expired') {
            this.infoMessage = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
        } else if (reason === 'registration_success') {
            this.infoMessage = 'Kaydınız başarıyla alındı! Lütfen giriş yapın.';
        }


        this.returnUrl = returnUrlFromQuery || '/';
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Lütfen kullanıcı adı ve şifre alanlarını doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const username = this.loginForm.value.username.trim();
    const password = this.loginForm.value.password;

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.authSubscription = this.authService.login(username, password).subscribe({
      next: (response: JwtResponse) => {
        this.isLoading = false;
        const userRole = this.authService.getUserRole(); 
        const accountStatus = this.authService.getAccountStatus();

        if (this.authService.isLoggedIn() && userRole) {
          this.snackBar.open(`Hoş geldiniz ${response.username}!`, 'Kapat', { duration: 3000, panelClass: ['success-snackbar'] });
          this.redirectBasedOnRoleAndStatus(userRole, accountStatus);
        } else {
          console.warn('LoginComponent: AuthService reported not logged in or no role after login attempt, despite a successful HTTP response from backend. Original backend response:', response);
          const logicalErrorMessage = 'Oturum başlatılamadı. Sunucudan beklenen bilgiler alınamadı veya eksik.';
          this.snackBar.open(logicalErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
          this.authService.logout();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Login failed in component:', error);
        let displayErrorMessage = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.';

        if (error.status === 401) { // Unauthorized
            if (error.error && typeof error.error.message === 'string') {
                const backendMsg = error.error.message.toLowerCase();
                if (backendMsg.includes('disabled') || backendMsg.includes('deactivated')) {
                     displayErrorMessage = 'Hesabınız devre dışı bırakılmıştır.';
                } else { // "Invalid username or password provided" veya "Bad credentials" gibi genel 401 mesajları
                     displayErrorMessage = 'Kullanıcı adı veya şifre hatalı.';
                }
            } else {
                 displayErrorMessage = 'Kullanıcı adı veya şifre hatalı.';
            }
        } else if (error.status === 0 || error.status === 503) {
            displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        } else if (error.error && typeof error.error.message === 'string') {
            displayErrorMessage = error.error.message;
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

    if (role === 'ROLE_ADMIN') {
      targetUrl = '/admin/dashboard';
    } else if (role === 'ROLE_SELLER') {
      if (accountStatus === 'APPROVED') {
        targetUrl = '/seller/dashboard';
      } else {
        this.snackBar.open('Satıcı hesabınız henüz onaylanmamış veya aktif değil.', 'Kapat', { duration: 5000 });
        this.authService.logout(); // Onaylanmamışsa token'ı temizle
        return;
      }
    } else if (role === 'ROLE_USER') {
      if (targetUrl.includes('/login') || targetUrl.includes('/register') || targetUrl.startsWith('/auth')) {
          targetUrl = '/'; // Üye ise ve returnUrl auth sayfalarıysa ana sayfaya yönlendir
      }
    } else {
      this.snackBar.open(`Tanımsız kullanıcı rolü (${role}). Yönlendirme yapılamadı.`, 'Kapat', { duration: 4000, panelClass: ['error-snackbar'] });
      this.authService.logout();
      return;
    }

    console.log(`LoginComponent: Navigating to ${targetUrl}`);
    this.router.navigateByUrl(targetUrl);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}
