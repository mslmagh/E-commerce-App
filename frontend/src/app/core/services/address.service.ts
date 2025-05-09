import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';

export interface AddressRequest {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Address {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/addresses`;

  constructor(private http: HttpClient) { }

  getUserAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError<Address[]>('getUserAddresses'))
      );
  }

  getAddressById(id: number): Observable<Address> {
    return this.http.get<Address>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<Address>(`getAddressById id=${id}`))
      );
  }

  createAddress(address: AddressRequest): Observable<Address> {
    return this.http.post<Address>(this.apiUrl, address)
      .pipe(
        catchError(this.handleError<Address>('createAddress'))
      );
  }

  updateAddress(id: number, address: AddressRequest): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/${id}`, address)
      .pipe(
        catchError(this.handleError<Address>(`updateAddress id=${id}`))
      );
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<void>(`deleteAddress id=${id}`))
      );
  }

  setDefaultAddress(id: number): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/${id}/default`, {})
      .pipe(
        catchError(this.handleError<Address>(`setDefaultAddress id=${id}`))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => error);
    };
  }
} 