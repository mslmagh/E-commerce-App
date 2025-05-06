// frontend/src/app/features/auth/components/register/register.component.ts
// SON HALİ (Standart Üye Kaydı - Satıcı Kaydına Geçiş Butonuyla - SCSS olmadan)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Standalone için
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Standalone için
import { Router, RouterLink } from '@angular/router'; // Standalone için
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Standalone için

// Angular Material Modülleri (Standalone component ise burada imports içinde olacak)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // isLoading için

@Component({
  selector: 'app-register',
  standalone: true, // Standalone component olarak işaretlendi
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule // Yükleme göstergesi için
  ],
  templateUrl: './register.component.html',
  styles: [`
    :host {
      display: flex;
      justify-content: center;
      align-items: flex-start; /* İçeriği yukarıdan başlatır */
      padding: 40px 16px; /* Üst ve yan boşluklar */
      box-sizing: border-box; /* Padding hesaba katılır */
      min-height: calc(100vh - 64px); /* Header yüksekliği varsayılarak (ayarlayın) */
      background-color: #f5f5f5; /* Hafif bir arka plan rengi */
    }
    .register-card {
      max-width: 480px; /* Kartın maksimum genişliği */
      width: 100%;
      margin: 0 auto; /* Ortalamak için */
    }
    .mat-card-header { /* Angular Material kart başlığı için özel stil gerekirse */
      display: flex;
      justify-content: center;
      padding-bottom: 16px;
    }
    .mat-mdc-form-field { /* Form alanları için tam genişlik */
      width: 100%;
      margin-bottom: 8px;
    }
    .submit-button-container { /* Butonu tam genişlik yapmak ve boşluk eklemek için */
      display: block; /* Veya flex ve justify-content: center; */
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .submit-button-container button {
        width: 100%;
    }
    .login-link-container, .switch-to-seller-container {
      text-align: center;
      margin-top: 16px;
      font-size: 0.9em;
    }
    .switch-to-seller-container {
      padding: 16px;
      margin-bottom: 24px;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 4px;
      background-color: #fafafa;
    }
    .switch-to-seller-container p {
      margin-bottom: 12px;
    }
    .form-intro-text {
      font-size: 0.9em;
      color: grey;
      margin-top: 16px;
      text-align: center;
    }
    .terms-field {
      margin-top: 16px;
      margin-bottom: 8px; /* submit butonuna daha yakın */
    }
    .terms-field a {
        text-decoration: none;
        color: #3f51b5; /* Angular Material primary rengi */
    }
    .terms-field a:hover {
        text-decoration: underline;
    }
    .registration-success-message {
      text-align: center;
      padding: 20px;
    }
    .registration-success-message h3 {
        color: #4CAF50; /* Yeşil bir başarı rengi */
        margin-bottom: 16px;
    }
    .registration-success-message p {
        font-size: 1.1em;
        margin-bottom: 16px;
    }
    .registration-success-message button {
        margin-top: 10px;
    }
    /* İki alanlı satır için basit flex */
    .name-fields-row {
      display: flex;
      gap: 16px; /* Alanlar arası boşluk */
    }
    .name-fields-row > mat-form-field { /* Satırdaki her form alanı */
      flex: 1; /* Eşit genişlikte yayıl */
    }
    /* Mobil için alt alta */
    @media (max-width: 599px) {
      .name-fields-row {
        flex-direction: column;
        gap: 0; /* Alt alta iken boşluk sıfır, form field kendi margin'ini kullanır */
      }
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  registrationSuccessful = false;
  private authSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): { [s: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ 'mismatch': true });
      return { 'mismatch': true };
    }
    // Eğer şifreler eşleşiyorsa ve 'confirmPassword' alanında 'mismatch' hatası varsa temizle
    // Ancak sadece 'mismatch' hatasını temizlemeli, diğer validasyon hatalarını (örn: required) etkilememeli
    if (form.get('confirmPassword')?.hasError('mismatch')) {
        // Diğer hataları koruyarak sadece mismatch'i silmek için:
        const errors = form.get('confirmPassword')?.errors;
        if (errors) {
            delete errors['mismatch'];
            if (Object.keys(errors).length === 0) {
                form.get('confirmPassword')?.setErrors(null);
            } else {
                form.get('confirmPassword')?.setErrors(errors);
            }
        }
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.snackBar.open('Lütfen tüm zorunlu alanları doğru doldurun.', 'Kapat', { duration: 3000, panelClass: ['warning-snackbar'] });
      return;
    }

    this.isLoading = true;
    const { confirmPassword, ...registrationData } = this.registerForm.value;

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.authSubscription = this.authService.registerMember(registrationData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.registrationSuccessful = true;
        this.snackBar.open('Üyelik kaydınız başarıyla oluşturuldu!', 'Kapat', { duration: 3000, panelClass: ['success-snackbar'] });
        // Formu tamamen sıfırla ve validasyon durumlarını temizle
        this.registerForm.reset();
        Object.keys(this.registerForm.controls).forEach(key => {
            this.registerForm.get(key)?.setErrors(null) ;
            this.registerForm.get(key)?.markAsPristine();
            this.registerForm.get(key)?.markAsUntouched();
        });
        this.registerForm.updateValueAndValidity();


        console.log('Member registration successful:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.registrationSuccessful = false;
        let displayErrorMessage = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        if (error.error && typeof error.error.message === 'string') {
          const backendMsg = error.error.message.toLowerCase();
          if (backendMsg.includes('email already exists') || backendMsg.includes('e-posta zaten kullanılıyor')) {
            displayErrorMessage = 'Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta deneyin veya giriş yapın.';
          } else {
            displayErrorMessage = error.error.message;
          }
        } else if (error.status === 0 || error.status === 503) {
          displayErrorMessage = 'Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.';
        }
        this.snackBar.open(displayErrorMessage, 'Kapat', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Member registration failed:', error);
      }
    });
  }

  navigateToSellerRegistrationPage(): void {
    this.router.navigate(['/auth/seller-register']); // Satıcı kayıt sayfasının yolu (Örnek)
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get termsAccepted() { return this.registerForm.get('termsAccepted'); }
}
