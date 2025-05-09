import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
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

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<Category[]> {
    console.log('CategoryService: Fetching categories from API');
    return this.http.get<Category[]>(this.apiUrl)
      .pipe(
        tap(categories => console.log(`CategoryService: Fetched ${categories.length} categories.`)),
        catchError(error => {
          console.error('Error fetching categories:', error);
          return throwError(() => new Error('Failed to fetch categories'));
        })
      );
  }

  getCategoryById(id: number): Observable<Category> {
    console.log(`CategoryService: Fetching category with ID: ${id}`);
    return this.http.get<Category>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(category => console.log(`CategoryService: Fetched category for ID ${id}:`, category)),
        catchError(error => {
          console.error(`Error fetching category with id ${id}:`, error);
          return throwError(() => new Error(`Failed to fetch category with id ${id}`));
        })
      );
  }

  createCategory(category: CategoryRequest): Observable<Category> {
    console.log('CategoryService: Creating new category', category);
    return this.http.post<Category>(this.apiUrl, category)
      .pipe(
        tap(newCategory => console.log('CategoryService: Created new category with ID:', newCategory.id)),
        catchError(error => {
          console.error('Error creating category:', error);
          return throwError(() => new Error('Failed to create category'));
        })
      );
  }

  updateCategory(id: number, category: CategoryRequest): Observable<Category> {
    console.log(`CategoryService: Updating category with ID: ${id}`, category);
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category)
      .pipe(
        tap(_ => console.log(`CategoryService: Updated category with ID: ${id}`)),
        catchError(error => {
          console.error(`Error updating category with id ${id}:`, error);
          return throwError(() => new Error(`Failed to update category with id ${id}`));
        })
      );
  }

  deleteCategory(id: number): Observable<void> {
    console.log(`CategoryService: Deleting category with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(_ => console.log(`CategoryService: Deleted category with ID: ${id}`)),
        catchError(error => {
          console.error(`Error deleting category with id ${id}:`, error);
          return throwError(() => new Error(`Failed to delete category with id ${id}`));
        })
      );
  }
} 