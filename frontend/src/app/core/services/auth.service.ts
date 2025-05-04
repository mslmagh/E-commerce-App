// frontend/src/app/core/services/auth.service.ts
// SON HAL (localStorage için Platform Kontrolü Eklendi - Yorumsuz)

import { Injectable, PLATFORM_ID, inject } from '@angular/core'; // PLATFORM_ID ve inject eklendi
import { isPlatformBrowser } from '@angular/common'; // isPlatformBrowser eklendi
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // of operatörü getProductById için kalmış olabilir, gerekmiyorsa silinebilir

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  // Hangi platformda çalıştığımızı anlamak için PLATFORM_ID'yi enjekte ediyoruz
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    const loginUrl = `${this.apiUrl}/auth/login`;
    const body = { email: email, password: password };
    console.log('AuthService: Sending login request to:', loginUrl);
    return this.http.post<any>(loginUrl, body);
  }

  register(userData: { name: string, email: string, password: string }): Observable<any> {
    const registerUrl = `${this.apiUrl}/auth/register`;
    console.log('AuthService: Sending register request to:', registerUrl);
    return this.http.post<any>(registerUrl, userData);
  }

  saveToken(token: string): void {
    // Sadece tarayıcı platformunda çalışıyorsak localStorage'a yaz
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      console.log('AuthService: Token saved to localStorage.');
    } else {
      console.log('AuthService: Not in browser, skipping localStorage save.');
    }
  }

  getToken(): string | null {
    // Platformu kontrol et
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken'); // 'authToken' anahtarını oku
      // Ne bulduğunu logla
      console.log('AuthService getToken (Browser): localStorage check for "authToken". Found:', token);
      return token;
    }
    // Tarayıcı değilse logla
    console.log('AuthService getToken (Server/Other): Not in browser, returning null.');
    return null;
  }
  isLoggedIn(): boolean {
    // Metodun çağrıldığını logla
    console.log('AuthService: isLoggedIn() called.');
    // Token'ı al (yukarıdaki metod çağrılacak ve kendi logunu yazacak)
    const token = this.getToken();
    // Sonucu hesapla
    const loggedIn = !!token;
    // Sonucu logla
    console.log('AuthService: isLoggedIn() result:', loggedIn, '(Token value was:', token, ')');
    return loggedIn;
  }

  logout(): void {
    // Sadece tarayıcı platformunda çalışıyorsak localStorage'dan sil
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      console.log('AuthService: Token removed from localStorage.');
    } else {
       console.log('AuthService: Not in browser, skipping localStorage remove.');
    }
    // Yönlendirme Component'te yapılmalı
  }
}
