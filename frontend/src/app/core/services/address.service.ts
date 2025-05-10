import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../../environment';
import { AuthService } from './auth.service';
import { AddressDto } from '../models/dto/address.dto';
import { AddressRequestDto } from '../models/dto/address-request.dto';

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

  getUserAddresses(): Observable<AddressDto[]> {
    console.log('AddressService: Fetching user addresses from API');
    return this.http.get<AddressDto[]>(this.apiUrl, this.getHttpOptions()).pipe(
      tap(addresses => console.log(`AddressService: Fetched ${addresses.length} addresses`)),
      catchError(this.handleError<AddressDto[]>('getUserAddresses', []))
    );
  }

  getAddressById(id: number): Observable<AddressDto> {
    console.log(`AddressService: Fetching address with ID: ${id}`);
    return this.http.get<AddressDto>(`${this.apiUrl}/${id}`, this.getHttpOptions()).pipe(
      tap(address => console.log(`AddressService: Fetched address for ID ${id}:`, address)),
      catchError(this.handleError<AddressDto>(`getAddressById id=${id}`))
    );
  }

  createAddress(address: AddressRequestDto): Observable<AddressDto> {
    console.log('AddressService: Creating new address', address);
    const formattedAddress = this.formatAddressRequest(address);
    console.log('AddressService: Formatted address for API (create):', formattedAddress);
    console.log('AddressService: JSON payload:', JSON.stringify(formattedAddress));
    return this.http.post<AddressDto>(this.apiUrl, formattedAddress, this.getHttpOptions()).pipe(
      tap(newAddress => console.log(`AddressService: Created new address with ID: ${newAddress.id}`)),
      catchError(error => this.handleGenericError(error, 'createAddress'))
    );
  }

  updateAddress(id: number, address: AddressRequestDto): Observable<AddressDto> {
    console.log(`AddressService: Updating address with ID: ${id}`, address);
    const formattedAddress = this.formatAddressRequest(address);
    console.log(`AddressService: Formatted address for API (update ID: ${id}):`, formattedAddress);
    console.log('AddressService: JSON payload:', JSON.stringify(formattedAddress));
    const updateUrl = `${this.apiUrl}/${id}`;
    return this.http.put<AddressDto>(updateUrl, formattedAddress, this.getHttpOptions()).pipe(
      tap(updatedAddress => console.log(`AddressService: Updated address with ID: ${id}`, updatedAddress)),
      catchError(error => this.handleGenericError(error, `updateAddress id=${id}`))
    );
  }

  deleteAddress(id: number): Observable<void> {
    console.log(`AddressService: Deleting address with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHttpOptions()).pipe(
      tap(_ => console.log(`AddressService: Deleted address with ID: ${id}`)),
      catchError(error => this.handleGenericError(error, `deleteAddress id=${id}`))
    );
  }

  private formatAddressRequest(address: AddressRequestDto): AddressRequestDto {
    return {
      phoneNumber: address.phoneNumber?.trim() || '',
      country: address.country?.trim() || '',
      city: address.city?.trim() || '',
      postalCode: address.postalCode?.trim() || '',
      addressText: address.addressText?.trim() || ''
    };
  }

  private handleGenericError(error: HttpErrorResponse, operation: string): Observable<never> {
    console.error(`${operation} failed:`, error); // Log the original HttpErrorResponse

    let userMessage = `İşlem başarısız (${operation}).`;

    if (error.error) {
      // Log the detailed error object from the backend if it exists
      console.error('Backend error response body:', JSON.stringify(error.error, null, 2));

      if (typeof error.error === 'string') {
        userMessage = error.error;
      } else if (error.error.message && typeof error.error.message === 'string') {
        userMessage = error.error.message;
      } else if (error.error.detail && typeof error.error.detail === 'string') {
        userMessage = error.error.detail;
      } else if (error.error.title && typeof error.error.title === 'string') {
        userMessage = error.error.title;
      } else if (Array.isArray(error.error.errors)) {
        // Common Spring Boot validation error structure
        const validationErrors = error.error.errors.map((e: any) => e.defaultMessage || JSON.stringify(e)).join(', ');
        userMessage = `Doğrulama hataları: ${validationErrors}`;
      } else if (typeof error.error === 'object') {
        // Fallback for other object structures
        const messages = Object.values(error.error).filter(v => typeof v === 'string');
        if (messages.length > 0) {
          userMessage = messages.join(', ');
        }
      }
    }

    // Override with more specific messages based on status code
    if (error.status === 0) {
      userMessage = 'Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
    } else if (error.status === 400) {
      // If we haven't extracted a more specific message from the body for 400, use a generic one.
      if (userMessage === `İşlem başarısız (${operation}).`) {
        userMessage = 'Gönderilen bilgilerde hata var. Lütfen tüm alanları kontrol edin.';
      }
    } else if (error.status === 401) {
      userMessage = 'Bu işlem için yetkiniz yok veya oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.';
      // Optionally, navigate to login: this.authService.logoutAndRedirect();
    } else if (error.status === 403) {
      userMessage = 'Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.';
    } else if (error.status === 404) {
      userMessage = 'İstenen kaynak bulunamadı.';
    } else if (error.status >= 500) {
      userMessage = 'Sunucuda beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin veya destek ile iletişime geçin.';
    }

    console.error(`Final user-facing error message for ${operation}: ${userMessage}`);
    return throwError(() => new Error(userMessage));
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      // For GET operations, we might not need the complex parsing, 
      // but let's delegate to the generic one for consistency in logging and message generation.
      return this.handleGenericError(error, operation) as unknown as Observable<T>; 
      // The 'as unknown as Observable<T>' is a bit of a hack because handleGenericError returns Observable<never>.
      // A better approach might be to have handleGenericError return () => new Error(...) and use it in catchError directly.
      // Or, make handleGenericError accept a result for fallback like the original handleError.
    };
  }
} 