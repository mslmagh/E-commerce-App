import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
// Angular Material Modülleri
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip'; // İkonlar için açıklama

// Kayıtlı Kart yapısı için Interface
export interface SavedCard {
  id: number | string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'other'; // Kart tipi (ikon için)
  last4Digits: string; // Son 4 hane
  expiryDate: string; // MM/YY formatında
  isDefault?: boolean;
}

@Component({
  selector: 'app-saved-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule // Tooltip için
  ],
  templateUrl: './saved-cards.component.html',
  // styleUrls: ['./saved-cards.component.css'] // ---> KALDIRILDI
  styles: [`
    .saved-cards-container { } /* Genel konteyner */
    .add-card-button-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }
    .mat-mdc-list-base { /* Material List padding'ini sıfırla */
      padding-top: 0;
    }
    .mat-mdc-list-item { /* Liste elemanı yüksekliği ve padding'i */
      height: 72px !important; /* Yüksekliği biraz artıralım */
    }
    .mat-mdc-list-item .mat-mdc-list-item-unscoped-content {
      display: flex;
      align-items: center;
      width: 100%; /* İçeriğin tam genişliği kullanmasını sağla */
    }
    .card-icon { /* Kart tipi ikonu */
      font-size: 2.5rem; /* İkonu büyüt */
      margin-right: 20px;
      width: 40px; /* İkon alanı genişliği */
      text-align: center;
      color: #6c757d; /* İkon rengi */
    }
    .card-details { /* Kart bilgileri alanı */
      flex-grow: 1; /* Kalan boşluğu doldur */
      line-height: 1.4;
    }
    .card-number {
      font-weight: 500;
      color: #333;
      font-size: 1rem;
    }
    .card-expiry {
      font-size: 0.9rem;
      color: #666;
    }
    .default-card-badge { /* Varsayılan kart rozeti */
      font-size: 0.7rem;
      background-color: #e8f5e9;
      color: #2e7d32;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
      font-weight: 500;
    }
    .card-actions { /* Sil butonu alanı */
      margin-left: auto; /* Butonu sağa iter */
    }
    .empty-cards-message { /* Kart yoksa mesajı */
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
      border: 1px dashed #ccc;
      border-radius: 8px;
      background-color: #f8f9fa;
    }
    .empty-cards-message p { margin-bottom: 20px; }
  `]
})
export class SavedCardsComponent implements OnInit {

  // Sahte kayıtlı kart verisi
  savedCards: SavedCard[] = [
    { id: 101, cardType: 'visa', last4Digits: '1234', expiryDate: '12/26', isDefault: true },
    { id: 102, cardType: 'mastercard', last4Digits: '5678', expiryDate: '08/25', isDefault: false },
  ];

  constructor() { }

  ngOnInit(): void {
    console.log('SavedCardsComponent loaded');
    // TODO: Gerçek uygulamada kayıtlı kartlar servisten çekilmeli
    // this.paymentService.getSavedCards().subscribe(...)
  }

  getCardIcon(cardType: string): string {
    // Basit ikon eşleştirmesi (Font Awesome varsayımı)
    switch (cardType) {
      case 'visa': return 'fa-brands fa-cc-visa';
      case 'mastercard': return 'fa-brands fa-cc-mastercard';
      case 'amex': return 'fa-brands fa-cc-amex';
      default: return 'fa-regular fa-credit-card'; // Varsayılan
    }
  }

  addNewCard(): void {
    console.log('TODO: Navigate to Add New Card Page/Open Modal');
    alert('Yeni Kart Ekleme Formu Açılacak (Henüz yapılmadı)');
    // Güvenli kart ekleme formu (muhtemelen iframe veya payment provider yönlendirmesi)
  }

  editCard(cardId: number | string): void {
    console.log('TODO: Open Edit Card Modal for ID:', cardId);
    alert(`Kart Düzenle Tıklandı: ${cardId} (Henüz yapılmadı)`);
  }

  deleteCard(cardId: number | string): void {
    console.log('TODO: Show confirmation and call service to delete card ID:', cardId);
    // if(confirm(`Kartı silmek istediğinize emin misiniz?`)) {
    //   this.paymentService.deleteCard(cardId).subscribe(...)
    // }
    alert(`Kart Sil Tıklandı: ${cardId} (Henüz yapılmadı)`);
  }

  makeDefault(cardId: number | string): void {
    console.log('TODO: Call service to make card default ID:', cardId);
    alert(`Varsayılan Yap Tıklandı: ${cardId} (Henüz yapılmadı)`);
  }
}
