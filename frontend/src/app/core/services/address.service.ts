import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../../environment';
import { AuthService } from './auth.service';
import { AddressDto } from '../models/dto/address.dto';
import { AddressRequestDto } from '../models/dto/address-request.dto';
import { Address } from '../models/address.model';
import { AddressRequest } from '../models/address-request.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/my-addresses`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Helper method to get HTTP options with auth headers
  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getAddressById(id: number): Observable<Address> {
    return this.http.get<Address>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  addAddress(addressData: AddressRequest): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, addressData)
      .pipe(catchError(this.handleError));
  }

  updateAddress(id: number, addressData: AddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/${id}`, addressData)
      .pipe(catchError(this.handleError));
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    // Customize error handling as needed (e.g., user-friendly messages)
    return throwError(() => new Error('Something bad happened; please try again later. Details: ' + error.message));
  }
} 