
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Router için
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip'; // Tooltip için
import { AuthService } from '../../../../core/services/auth.service'; // AuthService'i import et
import { Router } from '@angular/router'; // Router'ı import et

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './seller-layout.component.html',
  styles: [`
    .seller-container {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #f4f8fa; /* Hafif bir arka plan */
    }
    .seller-sidenav-container {
      flex: 1; /* Toolbar altındaki tüm alanı kapla */
      /* height: calc(100% - 64px); /* Eğer toolbar sabit yükseklikteyse */
    }
    mat-toolbar {
      position: sticky; /* Toolbar yukarıda sabit kalsın */
      top: 0;
      z-index: 1000; /* Diğer elemanların üzerinde kalması için */
    }
    .seller-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toolbar-logo-title {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
    }
    .toolbar-logo-title mat-icon {
      margin-right: 8px;
    }
    .toolbar-logo-title span {
      font-weight: 500; /* Biraz daha belirgin */
    }
    .spacer {
      flex: 1 1 auto;
    }
    .seller-sidenav {
      width: 250px; /* Yan menü genişliği */
      background-color: white; /* Yan menü arka planı */
      border-right: 1px solid rgba(0,0,0,0.12); /* Hafif bir ayırıcı çizgi */
    }
    .main-content-area {
      padding: 24px; /* İçerik alanına boşluk */
      height: 100%; /* Sidenav content'in tüm yüksekliğini kullan */
      box-sizing: border-box;
      overflow-y: auto; /* İçerik taşarsa scroll çıksın */
    }
    .mat-mdc-list-item.active-seller-link,
    a.mat-mdc-list-item:hover:not(.active-seller-link) { /* Hover stili */
        background-color: rgba(63, 81, 181, 0.08); /* Material primary renginin açığı */
    }
    .mat-mdc-list-item.active-seller-link {
        color: #3f51b5; /* Material primary rengi */
        font-weight: 500;
    }
    .mat-mdc-list-item.active-seller-link .mat-icon {
        color: #3f51b5;
    }
    .user-actions button {
        margin-left: 8px;
    }
  `]
})
export class SellerLayoutComponent {
  userRole: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.userRole = this.authService.getUserRole(); // Kullanıcı rolünü al
  }

  logout(): void {
    this.authService.logout(); // AuthService'teki logout metodunu çağır
  }
}
