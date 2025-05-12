import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Address } from '../../../core/models/address.model';
import { CreateOrderRequest } from '../../../core/models/create-order-request.model';
import { Order } from '../../../core/services/order.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-select-address',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './select-address.component.html',
  styleUrls: ['./select-address.component.css']
})
export class SelectAddressComponent implements OnInit {
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  isLoadingAddresses = true;
  isCreatingOrder = false;
  error: string | null = null;

  constructor(
    private addressService: AddressService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.snackBar.open('Adres seçimi için lütfen giriş yapın.', 'Giriş Yap', { duration: 3000 })
        .onAction().subscribe(() => {
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
        });
      this.isLoadingAddresses = false;
      return;
    }
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.isLoadingAddresses = true;
    this.error = null;
    this.addressService.getAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        if (this.addresses.length > 0) {
        }
        this.isLoadingAddresses = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Adresler yüklenirken bir hata oluştu: ' + err.message;
        this.snackBar.open(this.error, 'Kapat', { duration: 3000 });
        this.isLoadingAddresses = false;
      }
    });
  }

  onProceedToOrder(): void {
    if (!this.selectedAddressId) {
      this.snackBar.open('Lütfen bir teslimat adresi seçin.', 'Kapat', { duration: 3000 });
      return;
    }

    this.isCreatingOrder = true;
    this.error = null;

    const orderRequest: CreateOrderRequest = {
      shippingAddressId: this.selectedAddressId
    };

    this.orderService.createOrder(orderRequest).subscribe({
      next: (createdOrder: Order) => {
        this.isCreatingOrder = false;
        if (!createdOrder || !createdOrder.id) {
          this.error = 'Sipariş oluşturulamadı veya sipariş ID alınamadı.';
          this.snackBar.open(this.error, 'Kapat', { duration: 3000 });
          return;
        }
        this.snackBar.open('Siparişiniz başarıyla oluşturuldu! Ödeme adımına yönlendiriliyorsunuz...', 'Harika!', { duration: 3000 });
        this.router.navigate(['/checkout/payment', createdOrder.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.isCreatingOrder = false;
        this.error = 'Sipariş oluşturulurken bir hata oluştu: ' + (err.error?.message || err.message);
        this.snackBar.open(this.error, 'Kapat', { duration: 5000 });
      }
    });
  }

  addNewAddress(): void {
    this.router.navigate(['/checkout/new-address']);
  }
}
