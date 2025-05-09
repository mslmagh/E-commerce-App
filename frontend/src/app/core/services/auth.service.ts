// src/app/core/services/auth.service.ts
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environment'; // Environment importu

// Backend'den beklenen login yanıtı için interface
// Bu, backend/src/main/java/com/example/ecommerce/dto/JwtResponse.java ile eşleşmelidir.
export interface JwtResponse {
  token: string;
  type?: string; // Genellikle "Bearer"
  id: number;
  username: string;
  email: string;
  roles: string[];
}

// Backend'e gönderilecek login isteği için interface
// Bu, backend/src/main/java/com/example/ecommerce/dto/LoginRequest.java ile eşleşmelidir.
export interface LoginRequest {
  username: string;
  password: string;
}

// Backend'e gönderilecek üye kayıt isteği için interface
// Bu, backend/src/main/java/com/example/ecommerce/dto/SignupRequest.java ile eşleşmelidir.
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role?: string; // Backend 'role' olarak tek bir string bekliyor.
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  private loggedInStatus = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.loggedInStatus.asObservable();

  private userRole = new BehaviorSubject<string | null>(null);
  public userRole$: Observable<string | null> = this.userRole.asObservable();

  // Backend JwtResponse'da 'accountStatus' alanı olmadığı için bunu şimdilik localStorage'dan manuel yöneteceğiz.
  // İdealde bu bilgi de token ile veya /me endpoint'inden gelmeli.
  private accountStatus = new BehaviorSubject<string | null>(null);
  public accountStatus$: Observable<string | null> = this.accountStatus.asObservable();

  constructor(private http: HttpClient) {
    this.loadAuthDataFromStorage();
  }

  private loadAuthDataFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');
      const status = localStorage.getItem('accountStatus'); // Satıcı onay durumu için
      if (token && role) {
        this.loggedInStatus.next(true);
        this.userRole.next(role);
        if (status) this.accountStatus.next(status);
      }
    }
  }

  login(emailAsUsername: string, password: string): Observable<JwtResponse> {
    console.log('AuthService: Attempting login for username (using email):', emailAsUsername);
    const loginUrl = `${this.apiUrl}/auth/login`;
    const body: LoginRequest = { username: emailAsUsername, password: password };

    return this.http.post<JwtResponse>(loginUrl, body).pipe(
      tap((response) => {
        if (response && response.token && response.roles && response.roles.length > 0) {
          let primaryRole = response.roles[0];
          if (response.roles.includes('ROLE_ADMIN')) {
            primaryRole = 'ROLE_ADMIN';
          } else if (response.roles.includes('ROLE_SELLER')) {
            primaryRole = 'ROLE_SELLER';
          }
          // Backend'den 'accountStatus' gelmiyor. SELLER ise şimdilik 'APPROVED' varsayalım.
          const sellerStatus = primaryRole === 'ROLE_SELLER' ? 'APPROVED' : undefined;
          this.saveAuthData(response.token, primaryRole, response, sellerStatus);
          console.log('AuthService: Login successful, auth data saved.');
        } else {
          console.error('AuthService: Token or roles not found in login response!', response);
          this.clearAuthDataAndNotify();
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('AuthService: Login HTTP error', error);
        this.clearAuthDataAndNotify();
        return throwError(() => error);
      })
    );
  }

  registerMember(memberData: Omit<SignupRequest, 'role'>): Observable<any> {
    console.log('AuthService: Registering member:', memberData);
    const registerUrl = `${this.apiUrl}/auth/register`;
    const payload: SignupRequest = {
      ...memberData,
      role: 'ROLE_USER' // Bireysel üye için rolü ROLE_USER olarak ayarla
    };
    return this.http.post<any>(registerUrl, payload).pipe(
      tap((response) => {
        console.log('AuthService: Member registration API response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('AuthService: Member registration HTTP error', error);
        return throwError(() => error);
      })
    );
  }

  // Satıcı temel hesap kaydı (SellerRegistrationComponent'tan gelen verilerle)
  registerSeller(sellerData: SignupRequest): Observable<any> {
    console.log('AuthService: Registering seller (basic account):', sellerData);
    const registerUrl = `${this.apiUrl}/auth/register`;
    // `role` zaten sellerData içinde 'ROLE_SELLER' olarak geliyor olmalı.
    return this.http.post<any>(registerUrl, sellerData).pipe(
      tap((response) => {
        console.log('AuthService: Seller (basic account) registration API response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('AuthService: Seller (basic account) registration HTTP error', error);
        return throwError(() => error);
      })
    );
  }

  saveAuthData(token: string, role: string, jwtResponse: JwtResponse, accountStatus?: string | null): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', jwtResponse.id.toString());
      localStorage.setItem('username', jwtResponse.username);
      localStorage.setItem('userEmail', jwtResponse.email);

      if (accountStatus) {
        localStorage.setItem('accountStatus', accountStatus);
      } else {
        localStorage.removeItem('accountStatus');
      }
      this.loggedInStatus.next(true);
      this.userRole.next(role);
      this.accountStatus.next(accountStatus || null);
      console.log('AuthService: Auth data saved. Role:', role, 'Status:', accountStatus);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  getUserId(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userId');
    }
    return null;
  }

  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('username');
    }
    return null;
  }

  getUserEmail(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userEmail');
    }
    return null;
  }

  getUserRole(): string | null {
    if (isPlatformBrowser(this.platformId)) {
        return localStorage.getItem('userRole');
    }
    return this.userRole.getValue();
  }

  getAccountStatus(): string | null {
     if (isPlatformBrowser(this.platformId)) {
        return localStorage.getItem('accountStatus');
     }
    return this.accountStatus.getValue();
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
        return !!localStorage.getItem('authToken');
    }
    return this.loggedInStatus.getValue();
  }

  logout(): void {
    this.clearAuthDataAndNotify();
    console.log('AuthService: User logged out.');
    this.router.navigate(['/auth/login']);
  }

  private clearAuthDataAndNotify(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('accountStatus');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
    }
    this.loggedInStatus.next(false);
    this.userRole.next(null);
    this.accountStatus.next(null);
    console.log('AuthService: Auth data cleared and subjects updated.');
  }
}