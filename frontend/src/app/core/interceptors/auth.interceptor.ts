import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,  
  next: HttpHandlerFn          
  ): Observable<HttpEvent<unknown>> => { 

  const authService = inject(AuthService);
  const authToken = authService.getToken();

  if (authToken) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
    console.log('AuthInterceptor: Token mevcut, Authorization header eklendi.'); 
    
    return next(clonedReq);
  } else {
    console.log('AuthInterceptor: Token yok, istek değiştirilmeden gönderiliyor.');
    return next(req);
  }
};
