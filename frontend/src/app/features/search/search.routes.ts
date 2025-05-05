// frontend/src/app/features/search/search.routes.ts
import { Routes } from '@angular/router';
import { SearchComponent } from './search.component';

// Arama sonuçları sayfası için rotalar
export const SEARCH_ROUTES: Routes = [
  {
    path: '',
    component: SearchComponent
  }
  // Belki ileride farklı arama filtreleri için alt rotalar eklenebilir
];
