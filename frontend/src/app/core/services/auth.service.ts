// frontend/src/app/core/services/auth.service.ts
// GÜNCELLENMİŞ TAM HAL (Token Metodları Eklendi)

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators'; // Eğer gerekirse

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Backend API adresi (Güncellenmeli!)
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  // --- API Çağrı Metodları ---
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

  // --- TOKEN YÖNETİMİ METODLARI ---
  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
    console.log('AuthService: Token saved to localStorage.');
  }

  getToken(): string | null {
    // Tarayıcıda çalışıp çalışmadığını kontrol etmek iyi bir pratik olabilir (SSR için)
    // if (typeof localStorage !== 'undefined') { ... }
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    // Sadece token varlığına bakıyoruz, geçerliliğine değil (şimdilik)
    return !!token;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    console.log('AuthService: Token removed from localStorage.');
    // TODO: Yönlendirme
    // Örn: this.router.navigate(['/auth/login']); // (Router enjekte edilmeli)
  }
}
