// frontend/src/app/features/auth/login/login.component.ts
// SON HAL (Angular Material Modülleri Eklendi - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // Yolu Kontrol Et!

// ---- Angular Material Modüllerini Import Et ----
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // İkonlar için (opsiyonel)
// ----------------------------------------------

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // Reactive Forms için gerekli
    RouterLink,          // Kayıt Ol linki için
    // Eklenen Material Modülleri:
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule // İkon kullanacaksak
  ],
  templateUrl: './login.component.html',
  // Eski CSS dosyasını kullanmak yerine temel stilleri inline verelim
  // veya yeni bir .css dosyası oluşturup ona göre düzenleyelim.
  // Şimdilik eskiyi kaldıralım varsayalım ve inline ekleyelim:
  // styleUrls: ['./login.component.css']
  styles: [`
    /* Component'e özel minimal stil */
    :host { /* Component'in kendisini sayfada ortalamak için */
      display: flex;
      justify-content: center;
      align-items: flex-start; /* Üste yasla */
      padding-top: 50px; /* Yukarıdan boşluk */
      min-height: calc(100vh - 150px); /* Header/Footer yüksekliği hariç alanı doldurmaya çalış (yaklaşık) */
    }
    .login-form-container {
      max-width: 400px;
      width: 100%; /* Küçük ekranlarda tam genişlik */
      padding: 25px 30px;
      /* Material card gibi bir görünüm */
       box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                   0px 1px 1px 0px rgba(0, 0, 0, 0.14),
                   0px 1px 3px 0px rgba(0, 0, 0, 0.12);
       border-radius: 4px;
       background-color: white;
    }
    mat-form-field {
      width: 100%; /* Form alanları tam genişlik */
      margin-bottom: 5px; /* Hata mesajı için yer */
    }
    button[type="submit"] {
      display: block; /* Butonun satırı kaplaması için */
      width: 100%;
      padding: 10px 0; /* Buton yüksekliği */
      margin-top: 20px; /* Üstteki alanla boşluk */
      margin-bottom: 15px; /* Alttaki linkle boşluk */
      font-size: 1rem; /* Yazı boyutu */
    }
    .register-link-container {
       text-align: center;
       margin-top: 20px;
       font-size: 14px;
    }
    .register-link-container a {
       /* Material tema rengini kullanabilir: color: var(--mat-primary-500-contrast); */
       color: #007bff; /* Veya direkt renk */
       text-decoration: none;
       font-weight: 500;
    }
     .register-link-container a:hover {
       text-decoration: underline;
     }
  `]
})
export class LoginComponent implements OnInit {
  // --- Sınıfın geri kalanı (loginForm, constructor, ngOnInit, onSubmit, getters) aynı kalır ---
  loginForm!: FormGroup;
  infoMessage: string | null = null;
  private returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });

    this.route.queryParamMap.subscribe(params => {
      const reason = params.get('reason');
      const returnUrlFromQuery = params.get('returnUrl');
      if (reason === 'checkout_login_required') {
        this.infoMessage = 'Siparişe devam etmek için lütfen giriş yapın.';
      } else { this.infoMessage = null; }
      if (returnUrlFromQuery) { this.returnUrl = returnUrlFromQuery; }
    });
  }

  onSubmit(): void {
    console.log('onSubmit triggered!');
    this.infoMessage = null;
    if (this.loginForm.invalid) {
      console.log('Form is invalid - submission prevented.');
      this.loginForm.markAllAsTouched();
      return;
    }
    console.log('Form is valid, calling authService.login...');
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;
    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        if (response && response.token) {
          this.authService.saveToken(response.token);
          console.log('Login successful, navigating to:', this.returnUrl);
          this.router.navigateByUrl(this.returnUrl);
        } else {
          console.error('Token not found in response object:', response);
          this.infoMessage = 'Giriş başarılı ancak token alınamadı!';
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.infoMessage = error.error?.message || error.message || 'E-posta veya şifre hatalı.';
      }
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
