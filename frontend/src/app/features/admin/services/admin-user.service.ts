import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment'; // environment.ts dosyasının doğru yolu olduğundan emin olun

// Backend'den gelen AdminUserViewDto'ya karşılık gelen arayüz
export interface AdminUserView {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: Set<string>;
  taxId?: string;
  // Backend DTO'sunda olmayan ancak frontend'de olabilecek alanlar için:
  // registrationDate?: string; // Veya Date tipi olabilir, dönüşüme göre
  // firstName?: string; // Eğer username'den ayrıştırılmayacaksa
  // lastName?: string;
}

// Roller güncelleme isteği için DTO
export interface UserRoleUpdateRequest {
  roles: Set<string>;
}

// Durum güncelleme isteği için DTO
export interface UserStatusUpdateRequest {
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = `${environment.apiUrl}/admin/users`; // Temel API yolu

  constructor(private http: HttpClient) { }

  // Helper to get HttpHeaders with Authorization
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Token'ın saklandığı yerden alın
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(): Observable<AdminUserView[]> {
    return this.http.get<AdminUserView[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserById(userId: number): Observable<AdminUserView> {
    return this.http.get<AdminUserView>(`${this.apiUrl}/${userId}`, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserRoles(userId: number, roles: Set<string>): Observable<AdminUserView> {
    const payload: UserRoleUpdateRequest = { roles };
    return this.http.put<AdminUserView>(`${this.apiUrl}/${userId}/roles`, payload, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserStatus(userId: number, enabled: boolean): Observable<AdminUserView> {
    const payload = { enabled: enabled }; // Basit JavaScript nesnesi
    
    console.log('Sending JavaScript object payload to /status endpoint:', payload);
    
    // getAuthHeaders() zaten Content-Type: application/json içeriyor
    return this.http.put<AdminUserView>(
      `${this.apiUrl}/${userId}/status`,
      payload, // Doğrudan nesneyi gönderelim
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Daha gelişmiş hata yönetimi eklenebilir
  private handleError(error: any): Observable<never> {
    console.error('An error occurred in AdminUserService:', error);
    // Kullanıcıya gösterilebilecek bir hata mesajı formatlanabilir
    return throwError(() => new Error('Admin User Service Error: ' + (error.error?.message || error.message || 'Server error')));
  }
} 