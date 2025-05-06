import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider'; // Gerekirse kullanılabilir

// Adres interface'i
export interface Address {
  id: number | string;
  title: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  country: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './address-list.component.html',
  // styleUrls: ['./address-list.component.css'] // ---> KALDIRILDI
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
  `]
})
export class AddressListComponent implements OnInit {

  addresses: Address[] = [
    { id: 1, title: 'Ev Adresim', recipientName: 'Arda Akıncı', phone: '555 123 4567', addressLine: 'Örnek Mah. Test Cad. No: 1 Daire: 2', city: 'Antalya', country: 'Türkiye', isDefault: true },
    { id: 2, title: 'İş Adresim', recipientName: 'Arda Akıncı', phone: '555 987 6543', addressLine: 'Sanayi Sit. Tekno Sok. No: 10', city: 'İstanbul', country: 'Türkiye', isDefault: false },
  ];

  constructor() { }

  ngOnInit(): void {
    console.log('AddressListComponent loaded');
    // TODO: Gerçek uygulamada adresler bir servisten çekilmeli
    // this.addressService.getAddresses().subscribe(data => this.addresses = data);
  }

  addNewAddress(): void {
    console.log('TODO: Navigate to Add New Address Page/Open Modal');
    alert('Yeni Adres Ekleme Formu Açılacak (Henüz yapılmadı)');
    // this.router.navigate(['/profile/addresses/new']); // İleride eklenecek rota
  }

  editAddress(address: Address): void {
    console.log('TODO: Navigate to Edit Address Page/Open Modal for ID:', address.id);
    alert(`Adres Düzenle Tıklandı: ${address.title} (Henüz yapılmadı)`);
    // this.router.navigate(['/profile/addresses/edit', address.id]); // İleride eklenecek rota
  }

  deleteAddress(address: Address): void {
    console.log('TODO: Show confirmation and call service to delete address ID:', address.id);
    alert(`Adres Sil Tıklandı: ${address.title} (Henüz yapılmadı)`);
    // if (confirm(...)) { this.addressService.delete(address.id)... }
  }
}
