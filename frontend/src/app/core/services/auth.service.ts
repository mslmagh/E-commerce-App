import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs'; // BehaviorSubject eklendi
import { tap } from 'rxjs/operators'; // tap operatörünü login'de kullanabiliriz

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private platformId = inject(PLATFORM_ID);

  // Giriş durumunu tutacak ve yayınlayacak BehaviorSubject
  // Başlangıç değeri, token var mı yok mu kontrolüne göre belirlenir
  private loggedInStatus = new BehaviorSubject<boolean>(this.hasInitialToken());
  // Component'lerin abone olacağı public Observable
  public isLoggedIn$: Observable<boolean> = this.loggedInStatus.asObservable();

  constructor(private http: HttpClient) { }

  // Helper: Başlangıçta token var mı kontrolü (SSR uyumlu)
  private hasInitialToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('authToken');
    }
    return false;
  }

  // Login metodu: Başarılı olursa token'ı kaydet VE durumu güncelle
  login(email: string, password: string): Observable<any> {
    const loginUrl = `${this.apiUrl}/auth/login`;
    const body = { email: email, password: password };
    console.log('AuthService: Sending login request...');
    return this.http.post<any>(loginUrl, body).pipe(
      tap(response => { // Başarılı cevap gelirse tap ile araya gir
        if (response && response.token) {
          this.saveToken(response.token); // Token'ı kaydet (bu metod zaten status'u güncelleyecek)
        } else {
          console.error('AuthService: Token not found in login response!');
          // Başarılı cevap ama token yoksa logout durumu tetiklenebilir (isteğe bağlı)
          // this.loggedInStatus.next(false);
        }
      })
    );
  }

  register(userData: { name: string, email: string, password: string }): Observable<any> {
    const registerUrl = `${this.apiUrl}/auth/register`;
    console.log('AuthService: Sending register request...');
    return this.http.post<any>(registerUrl, userData);
  }

  // Token'ı kaydederken login durumunu GÜNCELLE
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      this.loggedInStatus.next(true); // <<< YENİ: Durumu true yap
      console.log('AuthService: Token saved and loggedInStatus updated.');
    } else {
      console.log('AuthService: Not in browser, skipping localStorage save.');
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // Bu metod artık BehaviorSubject'in anlık değerini döndürebilir veya sadece token varlığına bakabilir
  // Guard gibi anlık kontrol gereken yerler için kullanışlı
  isLoggedIn(): boolean {
    // return this.loggedInStatus.getValue(); // Anlık değeri döndürür
    // VEYA token varlığına bakmaya devam edelim, guard'ın çalışması için daha garanti olabilir
    const token = this.getToken();
    return !!token;
  }

  // Logout yaparken token'ı sil VE durumu güncelle
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      this.loggedInStatus.next(false); // <<< YENİ: Durumu false yap
      console.log('AuthService: Token removed and loggedInStatus updated.');
    } else {
       console.log('AuthService: Not in browser, skipping localStorage remove.');
    }
  }
}
