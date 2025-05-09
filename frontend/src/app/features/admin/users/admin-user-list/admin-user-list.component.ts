import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

export interface AdminManagedUser {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'MEMBER';
  isActive: boolean;
  registrationDate: Date;
  lastLogin?: Date;
}

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule
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
    .mat-column-name { flex: 1 1 180px; }
    .mat-column-email { flex: 1 1 200px; }
    .mat-column-role { flex: 0 0 100px; text-align: center;}
    .mat-column-registrationDate { flex: 0 0 140px; }
    .mat-column-isActive { flex: 0 0 120px; text-align: center; }
    .mat-column-actions { flex: 0 0 150px; text-align: center; }
    .actions-cell button:not(:last-child) { margin-right: 5px; }
    .loading-spinner-container, .no-users-message { text-align: center; padding: 40px; }
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
    `
  ]
})
export class AdminUserListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'registrationDate', 'isActive', 'actions'];
  dataSourceMat = new MatTableDataSource<AdminManagedUser>();
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void { this.loadUsers(); }
  ngAfterViewInit(): void {
      this.dataSourceMat.paginator = this.paginator;
      this.dataSourceMat.sort = this.sort;
      this.dataSourceMat.sortingDataAccessor = (item, property) => {
          switch (property) {
            case 'registrationDate': return item.registrationDate.getTime();
            case 'name': return `${item.firstName} ${item.lastName}`;
            default: return (item as any)[property];
          }
      };
      this.dataSourceMat.filterPredicate = (data: AdminManagedUser, filter: string): boolean => {
          const dataStr = `${data.id} ${data.firstName} ${data.lastName} ${data.email} ${data.role}`.toLowerCase();
          return dataStr.includes(filter);
      };
  }

  loadUsers(): void {
    this.isLoading = true;
    setTimeout(() => { // Simülasyon
      const mockUsers: AdminManagedUser[] = [
        { id: 101, firstName: 'Ali', lastName: 'Veli', email: 'ali.veli@email.com', role: 'MEMBER', isActive: true, registrationDate: new Date(2025, 3, 15) },
        { id: 102, firstName: 'Ayşe', lastName: 'Yılmaz', email: 'ayse.seller@shop.com', role: 'SELLER', isActive: true, registrationDate: new Date(2025, 4, 1) },
        { id: 103, firstName: 'Mehmet', lastName: 'Admin', email: 'admin@site.com', role: 'ADMIN', isActive: true, registrationDate: new Date(2025, 1, 1) },
        { id: 104, firstName: 'Zeynep', lastName: 'Kaya', email: 'zeynep@mail.net', role: 'MEMBER', isActive: false, registrationDate: new Date(2025, 2, 20) },
        { id: 105, firstName: 'Hasan', lastName: 'Demir', email: 'hasan.store@domain.org', role: 'SELLER', isActive: false, registrationDate: new Date(2025, 4, 5) },
      ];
      this.dataSourceMat.data = mockUsers;
      this.isLoading = false;
    }, 1000);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceMat.filter = filterValue.trim().toLowerCase();
    if (this.dataSourceMat.paginator) {
      this.dataSourceMat.paginator.firstPage();
    }
  }

  toggleUserStatus(user: AdminManagedUser, event: MatSlideToggleChange): void {
    const newStatus = event.checked;
    const actionText = newStatus ? 'aktif etmek' : 'yasaklamak';
    if (confirm(`${user.firstName} ${user.lastName} adlı kullanıcıyı ${actionText} istediğinizden emin misiniz?`)) {
        console.log(`TODO: Backend call to set user ${user.id} status to ${newStatus}`);
        this.updateUserStatusInBackend(user.id, newStatus, actionText, event.source); // source'u gönder
    } else {
        event.source.checked = !newStatus; // İptal edilirse toggle'ı geri al
        console.log('User status change cancelled.');
    }
  }

  private updateUserStatusInBackend(userId: string | number, newStatus: boolean, actionText: string, toggleSource: any): void {
    this.isLoading = true;
    setTimeout(() => {
        this.snackBar.open(`Kullanıcı ${actionText}ldi (Simülasyon).`, 'Tamam', { duration: 2000 });
        this.isLoading = false;
      }, 750);
  }

  changePasswordDirectly(user: AdminManagedUser, event: Event): void {
     event.stopPropagation();
     const newPassword = prompt(`${user.firstName} ${user.lastName} (${user.email}) için YENİ ŞİFREYİ girin (en az 6 karakter):`);

     if (newPassword && newPassword.trim().length >= 6) {
         const confirmPassword = prompt('Yeni şifreyi TEKRAR girin:');
         if (newPassword.trim() === confirmPassword?.trim()) {
             this.sendNewPasswordToBackend(user.id, newPassword.trim());
         } else if (confirmPassword !== null) {
             alert('Girilen şifreler eşleşmiyor!');
         } else {
             console.log('Password change cancelled at confirmation.');
         }
     } else if (newPassword !== null) {
         alert('Geçersiz şifre. En az 6 karakter olmalı.');
     } else {
        console.log('Password change cancelled.');
     }
  }

  private sendNewPasswordToBackend(userId: string | number, newPass: string): void {
      console.log(`TODO: Backend call to change password for user ${userId} to ${newPass}`);
      this.isLoading = true; // Genel yükleme göstergesi

      const snackRef = this.snackBar.open(`Kullanıcı ${userId} için şifre değiştirme isteği gönderiliyor...`);
      setTimeout(() => { // Simülasyon
           snackRef.dismiss();
           this.snackBar.open(`Kullanıcı ${userId} şifresi değiştirildi (Simülasyon).`, 'Tamam', { duration: 3000 });
           this.isLoading = false;
        }, 1500);
  }

  getRoleClass(role: AdminManagedUser['role']): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'SELLER': return 'role-seller';
      case 'MEMBER': return 'role-member';
      default: return '';
    }
  }

  UserDetails(user: AdminManagedUser): void {
    console.log('Navigating to user details for:', user.id);
    this.router.navigate(['/admin/users', user.id]);
  }
}
