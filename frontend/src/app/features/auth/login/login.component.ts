// frontend/src/app/features/auth/login/login.component.ts
// SON HAL (Yönlendirme ve ReturnUrl Eklendi - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router'; // Router ve ActivatedRoute eklendi
import { AuthService } from '../../../core/services/auth.service'; // !!! BU YOLU KONTROL ET !!!

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  infoMessage: string | null = null; // Checkout'tan veya hata durumundan gelen mesaj için
  private returnUrl: string = '/'; // Başarılı login sonrası gidilecek varsayılan sayfa (anasayfa)

  constructor(
    private authService: AuthService,
    private router: Router, // Router enjekte edildi
    private route: ActivatedRoute // Aktif rotadan query parametrelerini okumak için
  ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });

    // Sayfa yüklendiğinde URL'deki query parametrelerini oku
    this.route.queryParamMap.subscribe(params => {
      const reason = params.get('reason');
      const returnUrlFromQuery = params.get('returnUrl');

      // Eğer checkout'tan yönlendirme varsa bilgi mesajını ayarla
      if (reason === 'checkout_login_required') {
        this.infoMessage = 'Siparişe devam etmek için lütfen giriş yapın.';
      } else {
        this.infoMessage = null; // Diğer durumlarda mesaj yok
      }

      // Eğer bir geri dönüş adresi belirtilmişse onu sakla
      if (returnUrlFromQuery) {
        this.returnUrl = returnUrlFromQuery;
        console.log('LoginComponent: returnUrl set to', this.returnUrl);
      }
    });
  }

  onSubmit(): void {
    console.log('onSubmit triggered!');
    this.infoMessage = null; // Önceki hata mesajlarını temizle

    if (this.loginForm.invalid) {
      console.log('Form is invalid - submission prevented.');
      this.loginForm.markAllAsTouched(); // Geçersiz alanları kullanıcıya göstermek için
      return;
    }

    console.log('Form is valid, calling authService.login...');
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful!', response);
        if (response && response.token) {
          console.log('Token received, saving and navigating...');
          this.authService.saveToken(response.token);
          // alert('Giriş Başarılı!'); // Alert yerine direkt yönlendirme yapalım
          // Saklanan returnUrl'e veya varsayılan adrese git
          this.router.navigateByUrl(this.returnUrl);
        } else {
          console.error('Token not found in response object:', response);
          // Hata mesajını ekranda göster (HTML'de *ngIf ile)
          this.infoMessage = 'Giriş başarılı ancak token alınamadı! Lütfen tekrar deneyin.';
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        // Hata mesajını ekranda göster (HTML'de *ngIf ile)
        this.infoMessage = error.error?.message || error.message || 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
      }
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
