// src/app/core/services/auth.service.ts
//BURADAN ŞİMDİLİK MOCK DATA OLARAK KİMİN GİRECEĞİNİ BELİRLEYECEĞİZ
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
// 'of' ve 'delay' operatörlerini simülasyon için import edin
import { Observable, BehaviorSubject, tap, of } from 'rxjs'; // 'throwError' şimdilik kaldırıldı, sadece başarılı login'i simüle edelim
import { delay } from 'rxjs/operators';
import { Router } from '@angular/router';

// Backend'den beklenen login yanıtı için interface (bunu zaten tanımlamıştık)
interface LoginResponse {
  token: string;
  role: string; // Örn: 'ADMIN', 'SELLER', 'MEMBER'
  status?: string; // Satıcılar için: 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api';
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  private loggedInStatus = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.loggedInStatus.asObservable();

  private userRole = new BehaviorSubject<string | null>(null);
  public userRole$: Observable<string | null> = this.userRole.asObservable();

  private accountStatus = new BehaviorSubject<string | null>(null);
  public accountStatus$: Observable<string | null> = this.accountStatus.asObservable();

  constructor(private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      const status = localStorage.getItem('accountStatus');
      if (token && role) {
        this.loggedInStatus.next(true);
        this.userRole.next(role);
        if (status) this.accountStatus.next(status);
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    console.log('AuthService: Simulating login for email:', email);

    // --- LOGIN SİMÜLASYONU ---
    // Bu kısım, backend olmadan test yapabilmek için geçicidir.
    // Farklı rolleri test etmek için 'role' ve 'status' değerlerini değiştirebilirsiniz.

    // Örnek: Başarılı bir "SELLER" girişi simülasyonu
    const mockSellerResponse: LoginResponse = {
      token: 'mock-jwt-seller-token-12345',
     role: 'SELLER',
      status: 'APPROVED' // Satıcı panelini test etmek için 'APPROVED' yapalım
    };

    // Örnek: Başarılı bir "MEMBER" girişi simülasyonu
     const mockMemberResponse: LoginResponse = {
       token: 'mock-jwt-member-token-67890',
       role: 'MEMBER'
     };

    // Örnek: Başarılı bir "ADMIN" girişi simülasyonu
    const mockAdminResponse: LoginResponse = {
     token: 'mock-jwt-admin-token-abcde',
      role: 'ADMIN'
     };

    // Hangi kullanıcı tipini simüle etmek istiyorsanız onu seçin:
    const simulatedResponse = mockAdminResponse; // ŞİMDİLİK SELLER OLARAK GİRİŞ YAPALIM

    return of(simulatedResponse).pipe(
      delay(500), // Sanki bir ağ isteği yapılıyormuş gibi küçük bir gecikme
      tap(response => {
        if (response && response.token && response.role) {
          this.saveAuthData(response.token, response.role, response.status);
          console.log('AuthService (SIMULATED): Login successful, auth data saved.');
        } else {
          console.error('AuthService (SIMULATED): Mock response is invalid!');
          this.clearAuthDataAndNotify();
        }
      })
    );

    // ---- GERÇEK HTTP İSTEĞİ (Backend hazır olduğunda bu kısmı kullanacaksınız) ----
    // const loginUrl = `${this.apiUrl}/auth/login`;
    // const body = { email: email, password: password };
    // return this.http.post<LoginResponse>(loginUrl, body).pipe(
    //   tap({
    //     next: (response) => {
    //       if (response && response.token && response.role) {
    //         this.saveAuthData(response.token, response.role, response.status);
    //       } else {
    //         console.error('AuthService: Token or role not found in login response!');
    //         this.clearAuthDataAndNotify();
    //       }
    //     },
    //     error: (err) => {
    //       console.error('AuthService: Login error', err);
    //       this.clearAuthDataAndNotify();
    //     }
    //   })
    // );
  }

  // ... (registerMember, registerSellerApplication, saveAuthData, getToken, getUserRole, getAccountStatus, isLoggedIn, logout, clearAuthDataAndNotify metodları aynı kalacak) ...
  // Sadece registerMember ve registerSellerApplication içindeki gerçek http.post kısımlarını da isterseniz şimdilik of({}).pipe(delay()) ile simüle edebilirsiniz.
  // Örnek registerMember simülasyonu:
  registerMember(memberData: any): Observable<any> {
    console.log('AuthService (SIMULATED): Registering member:', memberData);
    return of({ success: true, message: 'Üyelik kaydı başarıyla simüle edildi!' }).pipe(delay(1000));
    // GERÇEK KOD:
    // const registerUrl = `${this.apiUrl}/auth/register/member`;
    // return this.http.post<any>(registerUrl, memberData);
  }

  registerSellerApplication(sellerData: any): Observable<any> {
    console.log('AuthService (SIMULATED): Submitting seller application:', sellerData);
    return of({ success: true, message: 'Satıcı başvurusu başarıyla simüle edildi ve alındı!' }).pipe(delay(1500));
    // GERÇEK KOD:
    // const registerUrl = `${this.apiUrl}/auth/seller-application`;
    // return this.http.post<any>(registerUrl, sellerData);
  }

  saveAuthData(token: string, role: string, status?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      if (status) {
        localStorage.setItem('accountStatus', status);
      } else {
        localStorage.removeItem('accountStatus');
      }
      this.loggedInStatus.next(true);
      this.userRole.next(role);
      this.accountStatus.next(status || null);
      console.log('AuthService: Auth data saved. Role:', role, 'Status:', status);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) { // Tarayıcıda çalışıp çalışmadığını kontrol et
        return localStorage.getItem('userRole'); // localStorage'dan al
    }
    return this.userRole.getValue(); // SSR veya diğer ortamlar için BehaviorSubject'ten
  }

  getAccountStatus(): string | null {
     if (isPlatformBrowser(this.platformId)) {
        return localStorage.getItem('accountStatus');
     }
    return this.accountStatus.getValue();
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
        return !!localStorage.getItem('authToken'); // Token varlığına göre
    }
    return this.loggedInStatus.getValue();
  }

  logout(): void {
    this.clearAuthDataAndNotify();
    console.log('AuthService: User logged out.');
    this.router.navigate(['/auth/login']); // Login sayfasına yönlendir
  }

  private clearAuthDataAndNotify(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('accountStatus');
    }
    this.loggedInStatus.next(false);
    this.userRole.next(null);
    this.accountStatus.next(null);
    console.log('AuthService: Auth data cleared and subjects updated.');
  }
}
