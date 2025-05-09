import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // MatSnackBarModule import edildiğinden emin olun

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule], // MatSnackBarModule burada
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
  checkoutMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar // SnackBar eklendi
  ) { }

  ngOnInit(): void {
    // authGuard zaten giriş kontrolünü yaptığı için, burada tekrar login'e yönlendirme
    // yapmaya gerek kalmayabilir. Guard yoksa aşağıdaki blok önemlidir.
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login'], {
        queryParams: {
          reason: 'checkout_login_required',
          returnUrl: this.router.url // Mevcut URL'yi (örn: /checkout) sakla
         }
      });
      return; // Component'in geri kalanının yüklenmesini engelle
    }

    this.addressForm = new FormGroup({
      'country': new FormControl('', Validators.required),
      'firstName': new FormControl('', Validators.required),
      'lastName': new FormControl('', Validators.required),
      'phone': new FormControl('', [Validators.required, Validators.pattern("^[0-9]{10,15}$")]),
      'email': new FormControl('', [Validators.required, Validators.email]),
      'city': new FormControl('', Validators.required),
      'addressTitle': new FormControl('', Validators.required)
      // İsteğe bağlı olarak 'addressLine2', 'district', 'postalCode' eklenebilir
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
    this.checkoutMessage = null;

    // authGuard zaten bu kontrolü yapıyor olacak.
    // if (!this.authService.isLoggedIn()) { ... } bloğu bu yüzden kaldırılabilir
    // veya ek bir güvenlik katmanı olarak kalabilir.

    if (this.addressForm.valid) {
      console.log('Address Form is valid.');
      const addressData = this.addressForm.value;
      console.log('Girilen Adres Bilgileri:', addressData);

      // TODO: Adres bilgilerini bir servise göndererek kaydet veya bir sonraki adıma taşı.
      // Örnek: this.checkoutService.setShippingAddress(addressData);

      this.snackBar.open('Adres bilgileri başarıyla alındı. Ödeme adımına yönlendiriliyorsunuz...', 'Tamam', {
        duration: 2500,
      });

      // Ödeme sayfasına yönlendir
      this.router.navigate(['/checkout/payment']);

    } else {
      console.log('Address Form is invalid.');
      this.checkoutMessage = 'Lütfen formdaki tüm zorunlu (*) alanları doğru şekilde doldurun.';
      this.addressForm.markAllAsTouched(); // Tüm alanlara dokunuldu yap (hataları göstermek için)
    }
  }

  // Getter metodları (form kontrollerine kolay erişim için)
  get country() { return this.addressForm.get('country'); }
  get firstName() { return this.addressForm.get('firstName'); }
  get lastName() { return this.addressForm.get('lastName'); }
  get phone() { return this.addressForm.get('phone'); }
  get email() { return this.addressForm.get('email'); }
  get city() { return this.addressForm.get('city'); }
  get addressTitle() { return this.addressForm.get('addressTitle'); }
}
