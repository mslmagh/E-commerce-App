import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AdminManagedUser } from '../admin-user-list/admin-user-list.component';

export interface AdminUserDetail extends AdminManagedUser {
  phone?: string; // Telefon numarası eklendi
  addressCount?: number; // Kayıtlı adres sayısı eklendi
  totalOrders?: number; // Toplam sipariş sayısı eklendi
}


@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './admin-user-detail.component.html',
  styles: [`
    .user-detail-page { padding: 20px; max-width: 900px; margin: 0 auto; }
    .user-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .user-detail-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; }
    .info-card, .actions-card { margin-bottom: 20px; }
    mat-card-title { font-size: 1.2em; font-weight: 500; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;}
    mat-card-content p { margin: 0 0 8px 0; line-height: 1.5; }
    mat-card-content strong { display: inline-block; min-width: 120px; color: #555; }
    .loading-container { text-align: center; padding: 50px; }
    .actions-card mat-card-content { display: flex; flex-wrap: wrap; gap: 15px; align-items: center; }
    .actions-card button { margin-right: 8px; }
    .status-toggle-container { display: flex; align-items: center; }
    .status-label { margin-right: 10px; font-weight: 500; }
    /* Rol chip stilleri (Listeden kopyalandı) */
     .role-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
     .role-admin { background-color: #ffebee; color: #b71c1c; }
     .role-seller { background-color: #e3f2fd; color: #0d47a1; }
     .role-member { background-color: #e8f5e9; color: #1b5e20; }
  `]
})
export class AdminUserDetailComponent implements OnInit, OnDestroy {
  user: AdminUserDetail | null = null;
  isLoading = false;
  userId: string | number | null = null;
  private routeSub!: Subscription;
  private userSub!: Subscription; // Eğer user için ayrı bir abonelik olsaydı


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.user = null;
        this.isLoading = true;
        const id = params.get('userId');
        if (id) {
          this.userId = id;
          console.log('Admin User Detail: Loading details for user ID:', this.userId);
          return this.getMockUserDetail(this.userId).pipe(delay(1000)); // Mock data simülasyonu
        } else {
          this.snackBar.open('Kullanıcı ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/admin/users']);
          return of(null);
        }
      })
    ).subscribe({
      next: (data: AdminUserDetail | null) => {
        if (data) {
          this.user = data;
          console.log('Admin User Detail: User data loaded:', this.user);
        } else if (this.userId) {
           const errorMsg = `Kullanıcı (${this.userId}) yüklenirken bir hata oluştu veya bulunamadı.`;
           this.snackBar.open(errorMsg, 'Kapat', { duration: 4000 });
           console.error(errorMsg);
           this.router.navigate(['/admin/users']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Admin User Detail: Error loading user details:', err);
        this.isLoading = false;
        this.snackBar.open('Kullanıcı detayları yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      }
    });
  }

  getMockUserDetail(id: string | number): Observable<AdminUserDetail | null> {
      console.log(`Admin User Detail: Fetching mock detail for ID: ${id}`);
       const mockUsers: AdminManagedUser[] = [
        { id: 101, firstName: 'Ali', lastName: 'Veli', email: 'ali.veli@email.com', role: 'MEMBER', isActive: true, registrationDate: new Date(2025, 3, 15) },
        { id: 102, firstName: 'Ayşe', lastName: 'Yılmaz', email: 'ayse.seller@shop.com', role: 'SELLER', isActive: true, registrationDate: new Date(2025, 4, 1) },
        { id: 103, firstName: 'Mehmet', lastName: 'Admin', email: 'admin@site.com', role: 'ADMIN', isActive: true, registrationDate: new Date(2025, 1, 1) },
        { id: 104, firstName: 'Zeynep', lastName: 'Kaya', email: 'zeynep@mail.net', role: 'MEMBER', isActive: false, registrationDate: new Date(2025, 2, 20) },
        { id: 105, firstName: 'Hasan', lastName: 'Demir', email: 'hasan.store@domain.org', role: 'SELLER', isActive: false, registrationDate: new Date(2025, 4, 5) },
      ];
      const foundUser = mockUsers.find(user => user.id === (typeof id === 'string' ? parseInt(id, 10) : id));

      if (foundUser) {
           const detailedUser: AdminUserDetail = { // Explicitly type as AdminUserDetail
               ...foundUser,
               phone: '5551234567', // Örnek telefon
               lastLogin: new Date(foundUser.registrationDate.getTime() + 5 * 24 * 60 * 60 * 1000), // Kayıttan 5 gün sonra gibi
               addressCount: foundUser.role === 'MEMBER' ? 2 : 0, // Üyelerin adres sayısı olsun
               totalOrders: foundUser.role !== 'ADMIN' ? (foundUser.id === 101 ? 5 : (foundUser.id === 102 ? 10 : 0)) : 0 // Sipariş sayısı
           };
           return of(detailedUser).pipe(delay(500)); // AdminUserDetail tipinde Observable döndür
      }

      return of(null).pipe(delay(500)); // Kullanıcı bulunamazsa null döndür
  }


  toggleUserStatus(user: AdminManagedUser, event: MatSlideToggleChange): void {
    const newStatus = event.checked;
    const actionText = newStatus ? 'aktif etmek' : 'yasaklamak';
     if (!user || user.id === undefined || this.user === null) {
         console.error('Admin User Detail: User object is null or has no ID.');
         event.source.checked = !newStatus; // Toggle'ı geri al
         this.snackBar.open('Kullanıcı durumu güncellenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
         return;
     }

        console.log(`Admin User Detail: TODO: Backend call to set user ${user.id} status to ${newStatus}`);
        this.isLoading = true; // Genel yükleme göstergesi

        setTimeout(() => {
             this.snackBar.open(`Kullanıcı ${actionText}ldi (Simülasyon).`, 'Tamam', { duration: 2000 });
             if (this.user) this.user.isActive = newStatus; // UI'ı güncelle
             this.isLoading = false;
        }, 750);

  }

  changePassword(): void {
      if (!this.user) return;
      const newPassword = prompt(`${this.user.firstName} ${this.user.lastName} (${this.user.email}) için YENİ ŞİFREYİ girin (en az 6 karakter):`);

      if (newPassword && newPassword.trim().length >= 6) {
          const confirmPassword = prompt('Yeni şifreyi TEKRAR girin:');
          if (newPassword.trim() === confirmPassword?.trim()) {
              console.log(`Admin User Detail: TODO: Backend call to change password for user ${this.user.id}`);
              this.isLoading = true;

              const snackRef = this.snackBar.open(`Kullanıcı ${this.user.id} için şifre değiştirme isteği gönderiliyor...`);
              setTimeout(() => { // Simülasyon
                  snackRef.dismiss();
                  this.snackBar.open(`Kullanıcı ${this.user?.firstName} şifresi değiştirildi (Simülasyon).`, 'Tamam', { duration: 3000 });
                  this.isLoading = false;
              }, 1500);

          } else if (confirmPassword !== null) {
              alert('Girilen şifreler eşleşmiyor!');
          } else {
              console.log('Admin User Detail: Password change cancelled at confirmation.');
          }
      } else if (newPassword !== null) {
          alert('Geçersiz şifre. En az 6 karakter olmalı.');
      } else {
         console.log('Admin User Detail: Password change cancelled by user.');
      }
  }


  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe(); // Eğer user için ayrı bir abonelik olsaydı
  }

  getRoleClass(role: AdminManagedUser['role']): string {
      switch (role) {
          case 'ADMIN': return 'role-admin'; // Admin rolü için farklı bir renk sınıfı tanımlayabilirsiniz
          case 'SELLER': return 'role-seller';
          case 'MEMBER': return 'role-member';
          default: return '';
      }
  }
}
