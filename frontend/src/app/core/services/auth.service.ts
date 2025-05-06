import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap,throwError } from 'rxjs';
import { Router } from '@angular/router'; // Router eklendi

// Backend'den beklenen login yanıtı için bir interface
interface LoginResponse {
  token: string;
  role: string; // Örn: 'ADMIN', 'SELLER', 'MEMBER'
  status?: string; // Satıcılar için: 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'
  // Diğer kullanıcı bilgileri de eklenebilir (örn: userId, name)
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api'; // Ana API yolunuzu kontrol edin
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router); // Router inject edildi

  private loggedInStatus = new BehaviorSubject<boolean>(false); // Başlangıç false, constructor'da güncellenecek
  public isLoggedIn$: Observable<boolean> = this.loggedInStatus.asObservable();

  private userRole = new BehaviorSubject<string | null>(null);
  public userRole$: Observable<string | null> = this.userRole.asObservable();

  private accountStatus = new BehaviorSubject<string | null>(null); // Satıcı hesap durumu için
  public accountStatus$: Observable<string | null> = this.accountStatus.asObservable();

  constructor(private http: HttpClient) {
    // Servis ilk yüklendiğinde localStorage'dan durumu yükle
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      const status = localStorage.getItem('accountStatus');

      if (token && role) {
        this.loggedInStatus.next(true);
        this.userRole.next(role);
        if (status) {
          this.accountStatus.next(status);
        }
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> { // LoginResponse döndür
    const loginUrl = `${this.apiUrl}/auth/login`;
    const body = { email: email, password: password };
    console.log('AuthService: Sending login request...');
    return this.http.post<LoginResponse>(loginUrl, body).pipe(
      tap({
        next: (response) => {
          if (response && response.token && response.role) {
            this.saveAuthData(response.token, response.role, response.status);
          } else {
            console.error('AuthService: Token or role not found in login response!');
            // Hatalı yanıt durumunda mevcut auth verilerini temizleyebiliriz
            this.clearAuthDataAndNotify();
          }
        },
        error: (err) => {
          // Login hatasında da auth verilerini temizle ve durumu güncelle
          console.error('AuthService: Login error', err);
          this.clearAuthDataAndNotify();
        }
      })
    );
  }

  // Standart üye kaydı için
  registerMember(userData: { name: string, email: string, password: string }): Observable<any> {
    const registerUrl = `${this.apiUrl}/auth/register/member`; // Endpoint'i buna göre güncelledim
    console.log('AuthService: Sending member register request...');
    return this.http.post<any>(registerUrl, userData);
  }

  // Satıcı başvurusu için (daha sonra eklenecek)
  registerSellerApplication(sellerData: any): Observable<any> {
    const registerUrl = `${this.apiUrl}/auth/seller-application`; // Backend endpoint'inizi kontrol edin
    console.log('AuthService: Sending REAL seller application request to:', registerUrl, 'with data:', sellerData);
    return this.http.post<any>(registerUrl, sellerData);
  }

  saveAuthData(token: string, role: string, status?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      if (status) {
        localStorage.setItem('accountStatus', status);
      } else {
        localStorage.removeItem('accountStatus'); // status yoksa veya null ise localStorage'dan sil
      }

      this.loggedInStatus.next(true);
      this.userRole.next(role);
      this.accountStatus.next(status || null); // status yoksa null ata
      console.log('AuthService: Auth data saved and subjects updated.');
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

  getUserRole(): string | null {
    // return localStorage.getItem('userRole'); // Direkt localStorage yerine BehaviorSubject'in anlık değeri daha iyi
    return this.userRole.getValue();
  }

  getAccountStatus(): string | null {
    // return localStorage.getItem('accountStatus');
    return this.accountStatus.getValue();
  }

  isLoggedIn(): boolean {
    // return !!this.getToken(); // Bu da çalışır ama BehaviorSubject anlık değeri daha reaktif
    return this.loggedInStatus.getValue();
  }

  logout(): void {
    this.clearAuthDataAndNotify();
    console.log('AuthService: User logged out.');
    this.router.navigate(['/login']); // Login sayfasına yönlendir
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
