import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogConfig } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddressService } from '../../../core/services/address.service';
import { Address } from '../../../core/models/address.model';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './address-list.component.html',
  styles: [`
    .address-list-container { padding: 0 10px; } /* İçerik alanına hafif padding */
    .add-address-button-container {
      text-align: right; /* Butonu sağa yasla */
      margin-bottom: 25px;
    }
    .address-card {
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important; /* Daha hafif gölge */
    }
    mat-card-title {
      font-size: 1.1rem;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee; /* Başlık altına çizgi */
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    mat-card-subtitle {
      color: rgba(0,0,0,.6); /* Material ikincil renk */
      margin-top: 8px; /* İsim/Telefonla başlık arası */
      display: block;
      font-size: 0.9rem;
    }
    mat-card-content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #333;
      padding-top: 10px;
    }
    mat-card-content p {
      margin: 0 0 8px 0; /* Paragraflar arası boşluk */
    }
    mat-card-actions {
      padding: 8px 0 0 0 !important; /* Üst padding, diğerleri sıfır */
    }
    .default-badge {
      font-size: 0.7rem;
      background-color: #e8f5e9; /* Yeşil tonu */
      color: #2e7d32;
      padding: 3px 8px;
      border-radius: 10px; /* Daha yuvarlak */
      margin-left: 10px;
      font-weight: 500;
    }
    .empty-message { /* Adres yoksa mesaj */
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
      border: 1px dashed #ccc;
      border-radius: 8px;
      background-color: #f8f9fa;
    }
     .empty-message p { margin-bottom: 20px; }
     .empty-message button { /* Buton ortada kalsın */ }
     .loading-container {
       display: flex;
       justify-content: center;
       padding: 50px 0;
     }
     .error-message {
       color: #f44336;
       margin: 10px 0;
       padding: 10px;
       background-color: #ffeaea;
       border-radius: 4px;
     }
     .auth-required {
       text-align: center;
       padding: 30px;
       border: 1px solid #e0e0e0;
       border-radius: 8px;
       background-color: #f9f9f9;
       margin: 20px 0;
     }
     .auth-required p {
       margin-bottom: 15px;
       color: #555;
     }
  `]
})
export class AddressListComponent implements OnInit {
  addresses: Address[] = [];
  isLoading = true;
  error = false;
  errorMessage = '';
  isAuthenticated = false;
  deleteInProgress = false;

  constructor(
    private addressService: AddressService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isLoggedIn();
    
    if (this.isAuthenticated) {
      this.loadAddresses();
    } else {
      this.isLoading = false;
    }
  }

  loadAddresses(): void {
    if (!this.authService.isLoggedIn()) {
      this.isAuthenticated = false;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = false;
    this.errorMessage = '';
    
    this.addressService.getAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.addresses = addresses;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading addresses:', err);
        this.error = true;
        this.errorMessage = err.message || 'Adres bilgileri yüklenirken bir hata oluştu.';
        this.isLoading = false;
        this.snackBar.open('Adres bilgileri yüklenirken bir hata oluştu.', 'Kapat', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  login(): void {
    this.router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: this.router.url } 
    });
  }

  addNewAddress(): void {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Adres eklemek için giriş yapmalısınız.', 'Giriş Yap', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.login();
      });
      return;
    }
    
    // Navigate to the address form
    this.router.navigate(['/profile/address-form']);
  }

  editAddress(address: Address): void {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Adres düzenlemek için giriş yapmalısınız.', 'Giriş Yap', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.login();
      });
      return;
    }
    
    this.router.navigate(['/profile/address-form', address.id]);
  }

  deleteAddress(address: Address): void {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Adres silmek için giriş yapmalısınız.', 'Giriş Yap', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      }).onAction().subscribe(() => {
        this.login();
      });
      return;
    }
    
    if (this.deleteInProgress) {
      return; // Prevent multiple delete operations
    }

    const confirmMessage = `"${address.addressText}" adresini silmek istediğinize emin misiniz?`;
    if (confirm(confirmMessage)) {
      this.deleteInProgress = true;
      
      this.addressService.deleteAddress(address.id!).subscribe({
        next: () => {
          this.deleteInProgress = false;
          this.snackBar.open('Adres başarıyla silindi.', 'Tamam', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadAddresses(); // Reload addresses after deletion
        },
        error: (err) => {
          this.deleteInProgress = false;
          console.error('Error deleting address:', err);
          this.snackBar.open('Adres silinirken bir hata oluştu.', 'Kapat', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
