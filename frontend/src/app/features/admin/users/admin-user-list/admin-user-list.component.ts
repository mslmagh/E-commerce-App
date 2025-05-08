// src/app/features/admin/users/admin-user-list/admin-user-list.component.ts

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
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // Aktif/Pasif için
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Onay kutusu için (opsiyonel)
import { FormsModule } from '@angular/forms'; // MatSlideToggle [(ngModel)] için

// import { AdminUserService } from '../../../../core/services/admin-user.service'; // Admin için ayrı bir servis olabilir

// Kullanıcı modeli
export interface AdminManagedUser {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'MEMBER';
  isActive: boolean; // true: Aktif, false: Yasaklı/Pasif
  registrationDate: Date;
  lastLogin?: Date; // Opsiyonel
}

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, // FormsModule eklendi
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './admin-user-list.component.html',
  styles: [`
    .user-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-field { width: 100%; max-width: 400px; }
    .user-table-container { overflow-x: auto; }
    table.mat-mdc-table { width: 100%; min-width: 900px; /* Geniş tablo için min-width */ box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; margin-bottom: 16px; }
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
    .role-admin { background-color: #ffebee; color: #b71c1c; } /* Kırmızı */
    .role-seller { background-color: #e3f2fd; color: #0d47a1; } /* Mavi */
    .role-member { background-color: #e8f5e9; color: #1b5e20; } /* Yeşil */
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }
    ::ng-deep .mat-mdc-slide-toggle .mdc-switch .mdc-switch__track { background-color: #ff4081 !important; } /* Pasif renk (pembe) */
    ::ng-deep .mat-mdc-slide-toggle.mat-checked .mdc-switch .mdc-switch__track { background-color: #69f0ae !important; } /* Aktif renk (yeşilimsi) */
    /* Pasif durum için opaklık */
    tr.inactive-user { opacity: 0.6; background-color: #fafafa; }
    tr.inactive-user:hover { opacity: 0.8; }
  `]
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
    public dialog: MatDialog, // Onay için dialog servisi
    // private adminUserService: AdminUserService // Gerçek servis
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSourceMat.paginator = this.paginator;
    this.dataSourceMat.sort = this.sort;
     this.dataSourceMat.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'registrationDate': return item.registrationDate.getTime();
          case 'name': return `${item.firstName} ${item.lastName}`; // Ad+Soyad'a göre sıralama
          default: return (item as any)[property];
        }
     };
     // Filtreleme için özel predicate (Ad+Soyad'a göre arama için)
     this.dataSourceMat.filterPredicate = (data: AdminManagedUser, filter: string): boolean => {
        const dataStr = `${data.id} ${data.firstName} ${data.lastName} ${data.email} ${data.role}`.toLowerCase();
        return dataStr.includes(filter);
      };
  }

  loadUsers(): void {
    this.isLoading = true;
    // TODO: Backend'den tüm kullanıcıları çek (AdminUserService)
    // this.adminUserService.getAllUsers({ page: 0, size: 10, sort: 'registrationDate,desc' }).subscribe({ ... });

    // Mock data
    setTimeout(() => {
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

  // Kullanıcı Aktif/Pasif Durumunu Değiştirme
  toggleUserStatus(user: AdminManagedUser, event: Event): void {
    event.stopPropagation(); // Satıra tıklama olayını tetiklemesin
    const newStatus = !user.isActive;
    const actionText = newStatus ? 'aktif etmek' : 'yasaklamak';

    // Onay isteyelim (Basit confirm veya MatDialog)
    if (confirm(`${user.firstName} ${user.lastName} adlı kullanıcıyı ${actionText} istediğinizden emin misiniz?`)) {
        console.log(`TODO: Backend call to ${actionText} user ${user.id}`);
        this.isLoading = true; // Geçici olarak yükleme durumu
        // this.adminUserService.setUserStatus(user.id, newStatus).subscribe({ ... });

        // Simülasyon
        setTimeout(() => {
          const userIndex = this.dataSourceMat.data.findIndex(u => u.id === user.id);
          if (userIndex > -1) {
              // MatTableDataSource'un içindeki veriyi güncellemek için yeni bir referans oluşturmak en iyisi
              const updatedData = [...this.dataSourceMat.data];
              updatedData[userIndex] = { ...updatedData[userIndex], isActive: newStatus };
              this.dataSourceMat.data = updatedData;

              this.snackBar.open(`Kullanıcı ${actionText}ldi (Simülasyon).`, 'Tamam', { duration: 2000 });
          }
          this.isLoading = false;
        }, 750);
    } else {
        // Eğer toggle'ı geri almak gerekiyorsa (kullanıcı iptal ettiyse)
        // MatSlideToggle'ın [(ngModel)] kullanılması veya event.source ile yönetilmesi gerekebilir.
        // Şimdilik basit tutuyoruz.
        console.log('User status change cancelled.');
    }
  }

  // Şifre Sıfırlama İsteği
  resetPassword(user: AdminManagedUser, event: Event): void {
     event.stopPropagation();
     if (confirm(`${user.firstName} ${user.lastName} için şifre sıfırlama e-postası göndermek istediğinizden emin misiniz?`)) {
         console.log(`TODO: Backend call to send password reset email for user ${user.id}`);
         this.isLoading = true;
         // this.adminUserService.sendPasswordReset(user.id).subscribe({...});

         // Simülasyon
         setTimeout(() => {
            this.snackBar.open('Şifre sıfırlama isteği gönderildi (Simülasyon).', 'Tamam', { duration: 3000 });
            this.isLoading = false;
         }, 1000);
     }
  }

  // Rol etiketleri için CSS sınıfı
  getRoleClass(role: AdminManagedUser['role']): string {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'SELLER': return 'role-seller';
      case 'MEMBER': return 'role-member';
      default: return '';
    }
  }

  // Satıra tıklandığında kullanıcı detayına git (opsiyonel)
  viewUserDetails(user: AdminManagedUser): void {
    console.log('Navigating to user details for:', user.id);
    // this.router.navigate(['/admin/users', user.id]); // Detay sayfası rotası
  }
}
