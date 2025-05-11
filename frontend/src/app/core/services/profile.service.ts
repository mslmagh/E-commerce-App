import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environment'; // Düzeltilmiş göreceli yol
import { AuthService } from './auth.service'; // AuthService'i import edin
import { UserProfile } from '../models/user-profile.model'; // UserProfile modelini import edin
import { UpdateUserProfileRequest } from '../models/update-user-profile-request.model'; // Import the new model

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`; // API URL'sini güncelleyin

  constructor(
    private http: HttpClient,
    private authService: AuthService // AuthService'i inject edin
  ) { }

  private getHttpOptions() {
    const token = this.authService.getToken();
    if (!token) {
      // Token yoksa hata fırlatabilir veya boş header dönebilirsiniz.
      // Bu senaryoda, bu metod çağrılmadan önce token varlığı kontrol edilmeli.
      console.warn('ProfileService: No auth token found for getHttpOptions. Requests might fail if unprotected.');
      return {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getCurrentUserProfile(): Observable<UserProfile> {
    if (!this.authService.isLoggedIn()) {
        return throwError(() => new Error('User not authenticated. Cannot fetch profile.'));
    }
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, this.getHttpOptions()).pipe(
      tap(profile => console.log('ProfileService: Fetched user profile', profile)),
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('ProfileService: An error occurred', error);
    // Kullanıcıya gösterilecek daha iyi bir hata mesajı oluşturulabilir.
    let errorMessage = 'Something bad happened; please try again later.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && typeof error.error.message === 'string') {
        errorMessage = error.error.message; // Backend'den gelen özel mesajı kullan
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  updateCurrentUserProfile(profileData: UpdateUserProfileRequest): Observable<UserProfile> {
    if (!this.authService.isLoggedIn()) {
      return throwError(() => new Error('User not authenticated. Cannot update profile.'));
    }
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, profileData, this.getHttpOptions()).pipe(
      tap(updatedProfile => {
        console.log('ProfileService: Updated user profile', updatedProfile);
        // Optionally, you might want to update a local BehaviorSubject or similar 
        // if other parts of the app need to react instantly to profile changes.
      }),
      catchError(this.handleError)
    );
  }

  // TODO: Add updateProfile method here later
  // updateProfile(profileData: Partial<UserProfile>): Observable<UserProfile> { ... }
} 