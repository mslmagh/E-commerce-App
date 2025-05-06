// frontend/src/app/features/profile/profile.component.ts
// SON HAL (Material Sidenav/List Modülleri ve Layout Stilleri Eklendi - Yorumsuz)

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// RouterOutlet child rotaları göstermek için, RouterLink/Active menü linkleri için
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
// Angular Material Modülleri
import { MatSidenavModule } from '@angular/material/sidenav'; // Yan menü (Sidenav)
import { MatListModule } from '@angular/material/list';     // Menü listesi
import { MatIconModule } from '@angular/material/icon';     // Menü ikonları (opsiyonel)

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, // Sağdaki içerik için
    RouterLink,   // Menü linkleri için
    RouterLinkActive, // Aktif menü linkini işaretlemek için
    // Material Modülleri:
    MatSidenavModule,
    MatListModule,
    MatIconModule // Opsiyonel ikonlar için
  ],
  templateUrl: './profile.component.html',
  // styleUrls: ['./profile.component.css'] // Eski CSS yerine inline stil
  styles: [`
    .profile-container {
      height: calc(100vh - 64px); /* Header yüksekliğini çıkar (eğer header sabitse) */
      /* Veya dinamik bir yükseklik */
      border-top: 1px solid rgba(0,0,0,0.12);
    }

    mat-sidenav {
      width: 250px; /* Yan menü genişliği */
      padding-top: 20px;
      border-right: 1px solid rgba(0,0,0,0.12); /* Menü ile içerik arasına çizgi */
    }

    mat-sidenav-content {
      padding: 40px 40px; /* İçerik alanına boşluk */
    }

    .mat-mdc-list-item { /* Liste elemanları */
      color: rgba(0,0,0,0.7);
    }
    .mat-mdc-list-item .mat-icon { /* Liste ikonları */
      color: rgba(0,0,0,0.7);
      margin-right: 15px;
    }

    /* Aktif link stili (RouterLinkActive ile eşleşen sınıf) */
    .active-profile-link {
      background-color: rgba(63, 81, 181, 0.1); /* Material primary renginin açığı (varsayım) */
      color: #3f51b5; /* Material primary rengi */
      font-weight: 500;
    }
    .active-profile-link .mat-icon {
      color: #3f51b5;
    }
  `]
})
export class ProfileComponent {
  // Şimdilik TS tarafında özel bir mantığa gerek yok
  // Layout ve routing HTML'den yönetilecek
  constructor() { }

  // ngOnInit(): void {}
}
