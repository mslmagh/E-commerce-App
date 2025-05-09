import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of, delay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  // Mock data for development without backend
  private mockCategories: Category[] = [
    {
      id: 1,
      name: 'Electronics',
      description: 'All electronic devices and gadgets',
      imageUrl: 'https://via.placeholder.com/300'
    },
    {
      id: 2,
      name: 'Accessories',
      description: 'Bags, cases, and other accessories',
      imageUrl: 'https://via.placeholder.com/300'
    },
    {
      id: 3,
      name: 'Home & Kitchen',
      description: 'Products for your home and kitchen',
      imageUrl: 'https://via.placeholder.com/300'
    },
    {
      id: 4,
      name: 'Sports',
      description: 'Sports equipment and athletic wear',
      imageUrl: 'https://via.placeholder.com/300'
    }
  ];

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<Category[]> {
    if (environment.mockApi) {
      console.log('CategoryService: Using mock categories data');
      return of([...this.mockCategories]).pipe(
        delay(300),
        tap(categories => console.log(`CategoryService: Fetched ${categories.length} mock categories.`))
      );
    }

    return this.http.get<Category[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error fetching categories:', error);
          return throwError(() => error);
        })
      );
  }

  getCategoryById(id: number): Observable<Category> {
    if (environment.mockApi) {
      console.log(`CategoryService: Fetching mock category with ID: ${id}`);
      const category = this.mockCategories.find(c => c.id === id);
      if (category) {
        return of({...category}).pipe(
          delay(200),
          tap(category => console.log(`CategoryService: Fetched mock category for ID ${id}:`, category))
        );
      }
      return throwError(() => new Error(`Category with ID ${id} not found`));
    }

    return this.http.get<Category>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching category with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  createCategory(category: CategoryRequest): Observable<Category> {
    if (environment.mockApi) {
      console.log('CategoryService: Creating new mock category', category);
      const newCategory: Category = {
        ...category,
        id: Math.max(...this.mockCategories.map(c => c.id)) + 1
      };
      this.mockCategories.push(newCategory);
      return of({...newCategory}).pipe(
        delay(300),
        tap(category => console.log('CategoryService: Created new mock category with ID:', category.id))
      );
    }

    return this.http.post<Category>(this.apiUrl, category)
      .pipe(
        catchError(error => {
          console.error('Error creating category:', error);
          return throwError(() => error);
        })
      );
  }

  updateCategory(id: number, category: CategoryRequest): Observable<Category> {
    if (environment.mockApi) {
      console.log(`CategoryService: Updating mock category with ID: ${id}`, category);
      const index = this.mockCategories.findIndex(c => c.id === id);
      if (index !== -1) {
        const updatedCategory: Category = {
          ...this.mockCategories[index],
          ...category
        };
        this.mockCategories[index] = updatedCategory;
        return of({...updatedCategory}).pipe(
          delay(300),
          tap(_ => console.log(`CategoryService: Updated mock category with ID: ${id}`))
        );
      }
      return throwError(() => new Error(`Category with ID ${id} not found`));
    }

    return this.http.put<Category>(`${this.apiUrl}/${id}`, category)
      .pipe(
        catchError(error => {
          console.error(`Error updating category with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  deleteCategory(id: number): Observable<void> {
    if (environment.mockApi) {
      console.log(`CategoryService: Deleting mock category with ID: ${id}`);
      const index = this.mockCategories.findIndex(c => c.id === id);
      if (index !== -1) {
        this.mockCategories.splice(index, 1);
        return of(undefined).pipe(
          delay(300),
          tap(_ => console.log(`CategoryService: Deleted mock category with ID: ${id}`))
        );
      }
      return throwError(() => new Error(`Category with ID ${id} not found`));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error deleting category with id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }
} 