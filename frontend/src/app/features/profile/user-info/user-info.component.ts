
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
    MatSnackBarModule // Gerekli tüm modüller burada
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
  `]
})
export class UserInfoComponent implements OnInit {
  userInfoForm!: FormGroup;
  passwordChangeForm!: FormGroup;
  days: number[] = Array.from({length: 31}, (_, i) => i + 1);
  months: {value: number, viewValue: string}[] = [
    {value: 1, viewValue: 'Ocak'}, {value: 2, viewValue: 'Şubat'}, {value: 3, viewValue: 'Mart'},
    {value: 4, viewValue: 'Nisan'}, {value: 5, viewValue: 'Mayıs'}, {value: 6, viewValue: 'Haziran'},
    {value: 7, viewValue: 'Temmuz'}, {value: 8, viewValue: 'Ağustos'}, {value: 9, viewValue: 'Eylül'},
    {value: 10, viewValue: 'Ekim'}, {value: 11, viewValue: 'Kasım'}, {value: 12, viewValue: 'Aralık'}
  ];
  years: number[] = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i - 18);

  constructor(
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void { this.initUserInfoForm(); this.initPasswordChangeForm(); this.loadUserInfo(); }
  initUserInfoForm(): void { this.userInfoForm = new FormGroup({ email: new FormControl({ value: '', disabled: true }, Validators.required), firstName: new FormControl('', Validators.required), lastName: new FormControl('', Validators.required), phone: new FormControl('', Validators.required), dobDay: new FormControl('', Validators.required), dobMonth: new FormControl('', Validators.required), dobYear: new FormControl('', Validators.required) }); }
  initPasswordChangeForm(): void { this.passwordChangeForm = new FormGroup({ currentPassword: new FormControl('', Validators.required), newPassword: new FormControl('', [Validators.required]), confirmNewPassword: new FormControl('', Validators.required) }, { validators: this.passwordsMatchValidator }); }
  loadUserInfo(): void { const mockUser = { email: 'arda@ornek.com', firstName: 'Arda', lastName: 'Akıncı', phone: '5551234567', dobDay: 15, dobMonth: 6, dobYear: 1995 }; this.userInfoForm.patchValue(mockUser); }
  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null { const password = control.get('newPassword'); const confirmPassword = control.get('confirmNewPassword'); if (!password || !confirmPassword || !password.value || !confirmPassword.value) { return null; } return password.value === confirmPassword.value ? null : { passwordsDontMatch: true }; };
  updateUserInfo(): void { if (this.userInfoForm.invalid) { this.userInfoForm.markAllAsTouched(); this.snackBar.open('Lütfen üyelik bilgilerindeki hataları düzeltin.', 'Kapat', { duration: 3000 }); return; } console.log('Updating User Info:', this.userInfoForm.getRawValue()); this.snackBar.open('Üyelik bilgileri güncellendi (Simülasyon).', 'Tamam', { duration: 3000 }); }
  updatePassword(): void { if (this.passwordChangeForm.invalid) { this.passwordChangeForm.markAllAsTouched(); this.snackBar.open('Lütfen şifre güncelleme formundaki hataları düzeltin.', 'Kapat', { duration: 3000 }); return; } console.log('Updating Password Data:', { currentPassword: this.passwordChangeForm.value.currentPassword, newPassword: this.passwordChangeForm.value.newPassword }); this.snackBar.open('Şifre güncellendi (Simülasyon).', 'Tamam', { duration: 3000 }); this.passwordChangeForm.reset(); }
  get firstName() { return this.userInfoForm.get('firstName'); } get lastName() { return this.userInfoForm.get('lastName'); } get phone() { return this.userInfoForm.get('phone'); } get dobDay() { return this.userInfoForm.get('dobDay'); } get dobMonth() { return this.userInfoForm.get('dobMonth'); } get dobYear() { return this.userInfoForm.get('dobYear'); }
  get currentPassword() { return this.passwordChangeForm.get('currentPassword'); } get newPassword() { return this.passwordChangeForm.get('newPassword'); } get confirmNewPassword() { return this.passwordChangeForm.get('confirmNewPassword'); }
}
