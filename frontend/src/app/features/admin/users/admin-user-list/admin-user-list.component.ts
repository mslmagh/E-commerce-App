import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AdminUserService, AdminUserView } from '../../services/admin-user.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './admin-user-list.component.html',
  styles: [
    `
    .user-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-field { width: 100%; max-width: 400px; }
    .user-table-container { overflow-x: auto; }
    table.mat-mdc-table { width: 100%; min-width: 900px; box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; margin-bottom: 16px; }
    .mat-column-id { flex: 0 0 80px; }
    .mat-column-username { flex: 1 1 180px; }
    .mat-column-email { flex: 1 1 200px; }
    .mat-column-roles { flex: 0 0 100px; text-align: center;}
    .mat-column-enabled { flex: 0 0 120px; text-align: center; }
    .mat-column-actions { flex: 0 0 150px; text-align: center; }
    .actions-cell button:not(:last-child) { margin-right: 5px; }
    .loading-spinner-container, .no-users-message, .error-message { text-align: center; padding: 40px; }
    .role-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
    .role-admin { background-color: #ffebee; color: #b71c1c; }
    .role-seller { background-color: #e3f2fd; color: #0d47a1; }
    .role-member { background-color: #e8f5e9; color: #1b5e20; }
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch .mdc-switch__track { background-color: #ff4081 !important; }
    ::ng-deep .mat-mdc-slide-toggle.mat-checked .mdc-switch .mdc-switch__track { background-color: #69f0ae !important; }
    tr.inactive-user { opacity: 0.6; background-color: #fafafa; }
    tr.inactive-user:hover { opacity: 0.8; }
    .error-message p { color: red; margin-bottom: 10px; }
    `
  ]
})
export class AdminUserListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['id', 'username', 'email', 'roles', 'enabled', 'actions'];
  dataSource = new MatTableDataSource<AdminUserView>();
  isLoading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminUserService: AdminUserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(retryAttempt = false): void {
    this.isLoading = true;
    this.error = null;
    this.adminUserService.getUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: users => {
          this.dataSource.data = users;
          // console.log('Users loaded:', users);
        },
        error: err => {
          console.error('Error loading users:', err);
          this.error = `Failed to load users: ${err.message || 'Unknown server error'}`;
          if (!retryAttempt) { // Avoid infinite loops if retry also fails for same reason
            this.snackBar.open(this.error, 'Retry', { duration: 5000 })
              .onAction().subscribe(() => this.loadUsers(true));
          } else {
            this.snackBar.open(this.error, 'Close', { duration: 5000 });
          }
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  navigateToDetail(userId: number): void {
    this.router.navigate(['/admin/users/detail', userId]);
  }

  toggleUserStatus(user: AdminUserView, event: MatSlideToggleChange): void {
    // Boolean değeri açıkça belirleyelim
    const isEnabled = event.checked === true;
    console.log('[AdminUserListComponent] toggleUserStatus called for user ID:', user.id, 
                'event.checked:', event.checked, 
                'typeof event.checked:', typeof event.checked, 
                'isEnabled:', isEnabled,
                'typeof isEnabled:', typeof isEnabled);
    
    this.adminUserService.updateUserStatus(user.id, isEnabled)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Optional cleanup if needed
        })
      )
      .subscribe({
        next: (updatedUser) => {
          this.snackBar.open(`User ${user.username} status updated to ${isEnabled ? 'enabled' : 'disabled'}.`, 'Close', { duration: 3000 });
          // Update local data
          const index = this.dataSource.data.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedUser;
            this.dataSource.data = [...this.dataSource.data]; // Trigger refresh
          }
        },
        error: (err: any) => {
          console.error('Error updating user status:', err);
          this.snackBar.open(`Failed to update user status: ${err.message || 'Unknown server error'}`, 'Close', { duration: 5000 });
          // Revert toggle state in UI
          event.source.checked = !event.checked;
          // Refresh data to ensure consistent state
          this.loadUsers();
        }
      });
  }

  getRolesAsString(roles: Set<string> | undefined): string {
    if (!roles) {
      return '';
    }
    return Array.from(roles).join(', ');
  }

  // Placeholder for future functionality
  changePasswordDirectly(user: AdminUserView, event: MouseEvent): void {
    event.stopPropagation(); // Prevent row click
    this.snackBar.open(`Password change for "${user.username}" is not yet implemented.`, 'Close', { duration: 3000 });
    // In a real implementation, this might open a dialog or navigate to a specific password change view.
  }
}
