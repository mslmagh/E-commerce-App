import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // MatSnackBarModule import edildiğinden emin olun
import { AddressService } from '../../core/services/address.service';
import { OrderService } from '../../core/services/order.service';
import { AddressRequest } from '../../core/models/address-request.model';
import { CreateOrderRequest } from '../../core/models/create-order-request.model';
import { switchMap } from 'rxjs/operators';

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
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private addressService: AddressService,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
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
      'postalCode': new FormControl('', Validators.required),
      'addressText': new FormControl('', Validators.required)
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
    this.addressForm.markAllAsTouched();

    if (this.addressForm.invalid) {
      console.log('Address Form is invalid.');
      this.checkoutMessage = 'Lütfen formdaki tüm zorunlu (*) alanları doğru şekilde doldurun.';
      return;
    }

    this.isLoading = true;

    const addressRequestData: AddressRequest = {
      phoneNumber: this.addressForm.value.phone,
      country: this.addressForm.value.country,
      city: this.addressForm.value.city,
      postalCode: this.addressForm.value.postalCode,
      addressText: this.addressForm.value.addressText
    };

    console.log('Attempting to save address:', addressRequestData);

    this.addressService.addAddress(addressRequestData).pipe(
      switchMap(savedAddress => {
        if (!savedAddress || !savedAddress.id) {
          throw new Error('Failed to save address or address ID is missing.');
        }
        console.log('Address saved successfully with ID:', savedAddress.id);
        this.snackBar.open('Adres başarıyla kaydedildi.', 'Tamam', { duration: 2000 });

        const orderRequest: CreateOrderRequest = {
          shippingAddressId: savedAddress.id
        };
        console.log('Attempting to create order with shippingAddressId:', savedAddress.id);
        return this.orderService.createOrder(orderRequest);
      })
    ).subscribe({
      next: (createdOrder) => {
        this.isLoading = false;
        if (!createdOrder || !createdOrder.id) {
          console.error('Order creation failed or order ID is missing.');
          this.snackBar.open('Sipariş oluşturulamadı. Lütfen tekrar deneyin.', 'Kapat', { duration: 3000 });
          return;
        }
        console.log('Order created successfully with ID:', createdOrder.id);
        this.snackBar.open('Siparişiniz başarıyla oluşturuldu! Ödeme adımına yönlendiriliyorsunuz...', 'Harika!', { duration: 3500 });
        this.router.navigate(['/checkout/payment', createdOrder.id]);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error during address saving or order creation:', err);
        this.checkoutMessage = `Bir hata oluştu: ${err.message || 'Lütfen daha sonra tekrar deneyin.'}`;
        this.snackBar.open(this.checkoutMessage, 'Kapat', { duration: 5000 });
      }
    });
  }

  get country() { return this.addressForm.get('country'); }
  get firstName() { return this.addressForm.get('firstName'); }
  get lastName() { return this.addressForm.get('lastName'); }
  get phone() { return this.addressForm.get('phone'); }
  get email() { return this.addressForm.get('email'); }
  get city() { return this.addressForm.get('city'); }
  get postalCode() { return this.addressForm.get('postalCode'); }
  get addressText() { return this.addressForm.get('addressText'); }
}
