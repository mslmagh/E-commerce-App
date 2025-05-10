import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { AdminUserService, AdminUserView } from '../../services/admin-user.service';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule
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
  user: AdminUserView | null = null;
  isLoading = false;
  userId!: number;
  private routeSub!: Subscription;

  userDetailForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private adminUserService: AdminUserService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.pipe(
      switchMap(params => {
        this.user = null;
        this.isLoading = true;
        const idParam = params.get('userId');
        if (idParam) {
          this.userId = +idParam;
          console.log('Admin User Detail: Loading details for user ID:', this.userId);
          return this.adminUserService.getUserById(this.userId);
        } else {
          this.snackBar.open('Kullanıcı ID bulunamadı!', 'Kapat', { duration: 3000 });
          this.router.navigate(['/admin/users']);
          return of(null);
        }
      })
    ).subscribe({
      next: (data: AdminUserView | null) => {
        if (data) {
          this.user = data;
          this.initializeForm();
          console.log('Admin User Detail: User data loaded:', this.user);
        } else if (this.userId) {
           const errorMsg = `Kullanıcı (${this.userId}) yüklenirken bir hata oluştu veya bulunamadı.`;
           this.snackBar.open(errorMsg, 'Kapat', { duration: 4000 });
           console.error(errorMsg);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Admin User Detail: Error loading user details:', err);
        this.isLoading = false;
        this.snackBar.open(`Kullanıcı detayları yüklenirken hata: ${err.message}`, 'Kapat', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      }
    });
  }

  initializeForm(): void {
    if (this.user) {
      this.userDetailForm = this.fb.group({
        enabled: [this.user.enabled, Validators.required],
      });

      this.userDetailForm.get('enabled')?.valueChanges.subscribe(newStatus => {
        if (this.user && this.user.enabled !== newStatus) {
          this.toggleUserStatus(newStatus);
        }
      });
    }
  }

  toggleUserStatus(newStatus: boolean): void {
     if (!this.user || this.user.id === undefined) {
         this.snackBar.open('Kullanıcı bilgileri eksik, durum güncellenemiyor.', 'Kapat', { duration: 3000 });
         return;
     }
     this.isLoading = true;
     this.adminUserService.updateUserStatus(this.user.id, newStatus).pipe(
      tap(updatedUser => {
        if (this.user) {
            this.user.enabled = updatedUser.enabled;
        }
      })
     ).subscribe({
        next: (updatedUser) => {
            this.snackBar.open(`Kullanıcı ${this.user?.username} durumu "${newStatus ? 'Aktif' : 'Pasif'}" olarak güncellendi.`, 'Tamam', { duration: 2500 });
            this.isLoading = false;
        },
        error: (err) => {
            this.snackBar.open(`Durum güncellenirken hata: ${err.message}`, 'Kapat', { duration: 4000 });
            this.userDetailForm.get('enabled')?.setValue(!newStatus, { emitEvent: false });
            this.isLoading = false;
        }
     });
  }

  changePassword(): void {
      if (!this.user) return;
      const newPassword = prompt(`${this.user.username} için YENİ ŞİFREYİ girin (en az 6 karakter):`);

      if (newPassword && newPassword.trim().length >= 6) {
          const confirmPassword = prompt('Yeni şifreyi TEKRAR girin:');
          if (newPassword.trim() === confirmPassword?.trim()) {
              console.log(`Admin User Detail: TODO: Backend call to change password for user ${this.user?.id}`);
              this.isLoading = true;

              const snackRef = this.snackBar.open(`Kullanıcı ${this.user?.id} için şifre değiştirme isteği gönderiliyor...`);
              setTimeout(() => {
                  snackRef.dismiss();
                  this.snackBar.open(`Kullanıcı ${this.user?.username} şifresi değiştirildi (Simülasyon).`, 'Tamam', { duration: 3000 });
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
  }

  getRolesAsString(roles: Set<string> | undefined | null): string {
    if (!roles) return '-';
    return Array.from(roles).join(', ');
  }
}
