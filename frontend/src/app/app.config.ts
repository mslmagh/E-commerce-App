

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

// HttpClient ve Interceptor için gerekli importlar:
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Kendi oluşturduğumuz interceptor'ı import ediyoruz
// !!! BU YOLUN DOĞRU OLDUĞUNU KONTROL ET (app.config.ts'e göre) !!!
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Mevcut provider'lar:
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    // HttpClient'ı interceptor'ımız ile birlikte sağlıyoruz:
    provideHttpClient(withInterceptors([
      authInterceptor
    ]))

    // Varsa diğer provider'lar buraya eklenebilir...
  ]
};
