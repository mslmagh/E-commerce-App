import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProfileService } from '../../../core/services/profile.service';
import { UserProfile } from '../../../core/models/user-profile.model';
import { UpdateUserProfileRequest } from '../../../core/models/update-user-profile-request.model';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-info.component.html',
  styles: [`
    /* :host { display: block; } */ /* Gerekirse */
    .user-info-container {
      display: flex;
      flex-direction: column; /* Kartları alt alta dizer */
      gap: 30px; /* Kartlar arası boşluk */
    }
    .info-card {
      /* Kartlara özel ek stil gerekirse */
      padding-bottom: 10px; /* Butonla alt kenar arası boşluk için */
    }
    /* Form içindeki satırlar (yan yana elemanlar için) */
    .form-row {
      display: flex;
      flex-wrap: wrap; /* Küçük ekranda alt alta */
      gap: 0 16px; /* Sadece yatay boşluk (dikey boşluk mat-form-field'dan gelir) */
    }
    /* Satırdaki her bir form alanı */
    .form-row > mat-form-field {
      flex: 1; /* Alanların esnemesini sağla */
      min-width: 120px; /* Örn: Doğum tarihi alanlarının çok daralmaması için */
    }
    mat-form-field {
      width: 100%; /* Varsayılan tam genişlik */
      margin-bottom: 10px; /* Form field'lar arası dikey boşluk */
    }
    mat-card-content form {
      display: flex;
      flex-direction: column;
    }
    mat-card-content form > button[type="submit"] {
      margin-top: 15px;
      align-self: flex-start; /* Butonu sola yasla */
      min-width: 150px;
    }
    /* Şifre eşleşmeme hatası için */
    .form-error-message {
      color: #f44336; /* Material warn rengi */
      font-size: 0.75rem; /* mat-error ile aynı */
      padding-left: 1px; /* Hafif içeriden başlasın */
      margin-top: -15px; /* Şifre Tekrar alanına yaklaştır */
      margin-bottom: 15px;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
  `]
})
export class UserInfoComponent implements OnInit {
  userInfoForm!: FormGroup;
  passwordChangeForm!: FormGroup;
  
  currentUserProfile: UserProfile | null = null;
  isLoadingProfile = false;
  profileError: string | null = null;
  isUpdatingProfile = false;

  constructor(
    private snackBar: MatSnackBar,
    private profileService: ProfileService
  ) { }

  ngOnInit(): void {
    this.initUserInfoForm();
    this.initPasswordChangeForm();
    this.loadUserInfo();
  }

  initUserInfoForm(): void {
    this.userInfoForm = new FormGroup({
      email: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.email]),
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      phoneNumber: new FormControl('', Validators.required),
      taxId: new FormControl('')
    });
  }

  initPasswordChangeForm(): void {
    this.passwordChangeForm = new FormGroup({
      currentPassword: new FormControl('', Validators.required),
      newPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmNewPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordsMatchValidator });
  }

  loadUserInfo(): void {
    this.isLoadingProfile = true;
    this.profileError = null;
    this.profileService.getCurrentUserProfile().subscribe({
      next: (profile: UserProfile) => {
        this.currentUserProfile = profile;
        this.userInfoForm.patchValue({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber,
          taxId: profile.taxId
        });
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.profileError = err.message || 'Profil bilgileri yüklenirken bir hata oluştu.';
        this.snackBar.open(this.profileError!, 'Kapat', { duration: 5000 });
        this.isLoadingProfile = false;
      }
    });
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmNewPassword');
    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }
    return password.value === confirmPassword.value ? null : { passwordsDontMatch: true };
  };

  updateUserInfo(): void {
    if (this.userInfoForm.invalid) {
      this.userInfoForm.markAllAsTouched();
      this.snackBar.open('Lütfen üyelik bilgilerindeki hataları düzeltin.', 'Kapat', { duration: 3000 });
      return;
    }

    if (!this.userInfoForm.dirty) {
        this.snackBar.open('Değişiklik yapılmadı.', 'Kapat', { duration: 3000 });
        return;
    }

    this.isUpdatingProfile = true;
    const rawValue = this.userInfoForm.getRawValue();
    const requestData: UpdateUserProfileRequest = {
      firstName: rawValue.firstName,
      lastName: rawValue.lastName,
      phoneNumber: rawValue.phoneNumber
    };

    // Only include taxId if the user is a seller
    if (this.isSeller) {
      requestData.taxId = rawValue.taxId;
    }

    this.profileService.updateCurrentUserProfile(requestData).subscribe({
      next: (updatedProfile) => {
        this.currentUserProfile = updatedProfile; // Update local profile data
        this.userInfoForm.patchValue({
            email: updatedProfile.email, // Email is not updated but good to keep form consistent
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            phoneNumber: updatedProfile.phoneNumber,
            taxId: updatedProfile.taxId
        });
        this.userInfoForm.markAsPristine(); // Reset dirty state after successful update
        this.snackBar.open('Üyelik bilgileri başarıyla güncellendi.', 'Tamam', { duration: 4000 });
        this.isUpdatingProfile = false;
      },
      error: (err) => {
        console.error('Error updating user profile:', err);
        this.snackBar.open(err.message || 'Profil güncellenirken bir hata oluştu.', 'Kapat', { duration: 5000 });
        this.isUpdatingProfile = false;
      }
    });
  }

  updatePassword(): void {
    if (this.passwordChangeForm.invalid) {
      this.passwordChangeForm.markAllAsTouched();
      this.snackBar.open('Lütfen şifre güncelleme formundaki hataları düzeltin.', 'Kapat', { duration: 3000 });
      return;
    }
    console.log('Updating Password Data:', {
      currentPassword: this.passwordChangeForm.value.currentPassword,
      newPassword: this.passwordChangeForm.value.newPassword
    });
    this.snackBar.open('Şifre güncellendi (Simülasyon - Backend entegrasyonu gerekiyor).', 'Tamam', { duration: 4000 });
    this.passwordChangeForm.reset();
  }

  get email() { return this.userInfoForm.get('email'); }
  get firstName() { return this.userInfoForm.get('firstName'); }
  get lastName() { return this.userInfoForm.get('lastName'); }
  get phoneNumber() { return this.userInfoForm.get('phoneNumber'); }
  get taxId() { return this.userInfoForm.get('taxId'); }

  get currentPassword() { return this.passwordChangeForm.get('currentPassword'); }
  get newPassword() { return this.passwordChangeForm.get('newPassword'); }
  get confirmNewPassword() { return this.passwordChangeForm.get('confirmNewPassword'); }

  get isSeller(): boolean {
    return !!this.currentUserProfile && this.currentUserProfile.roles.includes('ROLE_SELLER');
  }
}
