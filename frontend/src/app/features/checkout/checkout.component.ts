// frontend/src/app/features/checkout/checkout.component.ts
// SON HAL (Login Kontrolü ve Yönlendirme Eklendi - Yorumsuz)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router'; // Router gerekli
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // CommonModule ve ReactiveFormsModule gerekli
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  addressForm!: FormGroup;
  countries: string[] = ['Türkiye', 'Almanya', 'Amerika Birleşik Devletleri', 'Diğer'];
  cities: { [key: string]: string[] } = {
    'Türkiye': ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Diğer'],
    'Almanya': ['Berlin', 'Münih', 'Hamburg', 'Diğer'],
    'Amerika Birleşik Devletleri': ['New York', 'Los Angeles', 'Chicago', 'Diğer'],
    'Diğer': ['Diğer Şehir']
  };
  availableCities: string[] = [];
  checkoutMessage: string | null = null; // Form validasyon hatası mesajı için

  constructor(
    private authService: AuthService, // Enjekte edildi
    private router: Router // Enjekte edildi
  ) { }

  ngOnInit(): void {
    this.addressForm = new FormGroup({
      'country': new FormControl('', Validators.required),
      'firstName': new FormControl('', Validators.required),
      'lastName': new FormControl('', Validators.required),
      'phone': new FormControl('', [Validators.required, Validators.pattern("^[0-9]{10,15}$")]),
      'email': new FormControl('', [Validators.required, Validators.email]),
      'city': new FormControl('', Validators.required),
      'addressTitle': new FormControl('', Validators.required)
    });

    this.addressForm.get('country')?.valueChanges.subscribe(selectedCountry => {
      if (selectedCountry) {
        this.availableCities = this.cities[selectedCountry] || [];
      } else {
        this.availableCities = [];
      }
      this.addressForm.get('city')?.setValue('');
      this.addressForm.get('city')?.markAsUntouched();
    });
  }

  onSubmit(): void {
    console.log('Address Form Submit triggered!');
    this.checkoutMessage = null; // Önceki mesajları temizle

    // 1. GİRİŞ KONTROLÜ
    if (!this.authService.isLoggedIn()) {
      console.log('User not logged in. Redirecting to login with reason.');
      this.router.navigate(['/auth/login'], {
        queryParams: {
           reason: 'checkout_login_required', // Login sayfasına neden geldiğini bildir
           returnUrl: '/checkout' // Login sonrası geri dönülecek adres
          }
      });
      return; // Burada bitir
    }

    // 2. FORM GEÇERLİLİK KONTROLÜ (Eğer giriş yapılmışsa)
    if (this.addressForm.valid) {
      console.log('Address Form is valid.');
      console.log('Form Data:', this.addressForm.value);
      alert('Adres bilgisi alındı (Kullanıcı Giriş Yapmış). Sonraki adım: Ödeme.');
      // TODO: Adresi kaydetme (Servis çağrısı)
      // TODO: Ödeme sayfasına yönlendirme (Router)
    } else {
      console.log('Address Form is invalid.');
      this.checkoutMessage = 'Lütfen formdaki tüm zorunlu (*) alanları doğru şekilde doldurun.'; // Geçersiz form mesajını ayarla
      this.addressForm.markAllAsTouched(); // Tüm alanlara dokunuldu yap (hataları göstermek için)
    }
  }

  // Getter metodları
  get country() { return this.addressForm.get('country'); }
  get firstName() { return this.addressForm.get('firstName'); }
  get lastName() { return this.addressForm.get('lastName'); }
  get phone() { return this.addressForm.get('phone'); }
  get email() { return this.addressForm.get('email'); }
  get city() { return this.addressForm.get('city'); }
  get addressTitle() { return this.addressForm.get('addressTitle'); }
}
