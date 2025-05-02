

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  // AuthService enjekte edildi
  constructor(
    private authService: AuthService
    // private router: Router // Yönlendirme için ileride
    ) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, Validators.required)
    });
  }

  onSubmit(): void {
    console.log('onSubmit triggered!');
    if (this.loginForm.invalid) {
      console.log('Form is invalid - submission prevented.');
      // this.loginForm.markAllAsTouched();
      return;
    }

    console.log('Form is valid, calling authService.login...');
    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    this.authService.login(email, password).subscribe({
      next: (response) => { // <-- GÜNCELLENMİŞ KISIM BAŞLANGICI
        console.log('Login successful!', response);
        // Backend cevabında 'token' alanı olduğunu varsayıyoruz
        if (response && response.token) {
          console.log('Token received:', response.token);
          // AuthService'e token'ı kaydetmesi için gönder
          this.authService.saveToken(response.token);
          alert('Giriş Başarılı! Token kaydedildi (localStorage).');
          // TODO: Yönlendirme (this.router.navigate...)
        } else {
          // Token gelmediyse veya cevap formatı farklıysa hata ver
          console.error('Token not found in response object:', response);
          alert('Giriş başarılı ancak token alınamadı!');
        } // <-- GÜNCELLENMİŞ KISIM SONU
      },
      error: (error) => {
        console.error('Login failed:', error);
        const errorMessage = error.error?.message || error.message || 'Giriş sırasında bir hata oluştu.';
        alert('Giriş Başarısız! Hata: ' + errorMessage);
      }
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
