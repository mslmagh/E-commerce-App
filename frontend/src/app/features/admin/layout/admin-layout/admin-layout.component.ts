import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatToolbarModule, MatIconModule, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './admin-layout.component.html',
  styles: [`
    /* SellerLayoutComponent'teki stillere benzer stiller kullanılabilir,
       renkler veya menü genişliği gibi detaylar değiştirilebilir. */
    .admin-container { display: flex; flex-direction: column; position: absolute; top: 0; bottom: 0; left: 0; right: 0; background-color: #eeeeee; } /* Farklı arka plan */
    .admin-sidenav-container { flex: 1; }
    mat-toolbar { position: sticky; top: 0; z-index: 1000; }
    .admin-toolbar { display: flex; justify-content: space-between; align-items: center; }
    .toolbar-logo-title { display: flex; align-items: center; text-decoration: none; color: inherit; }
    .toolbar-logo-title mat-icon { margin-right: 8px; }
    .toolbar-logo-title span { font-weight: 500; }
    .spacer { flex: 1 1 auto; }
    .admin-sidenav { width: 260px; background-color: white; border-right: 1px solid rgba(0,0,0,0.12); }
    .main-content-area { padding: 24px; height: 100%; box-sizing: border-box; overflow-y: auto; }
    .mat-mdc-list-item.active-admin-link,
    a.mat-mdc-list-item:hover:not(.active-admin-link) { background-color: rgba(63, 81, 181, 0.08); }
    .mat-mdc-list-item.active-admin-link { color: #3f51b5; font-weight: 500; }
    .mat-mdc-list-item.active-admin-link .mat-icon { color: #3f51b5; }
    .user-actions button { margin-left: 8px; }
    h3[matSubheader] { font-weight: 500; color: rgba(0,0,0,.6); margin-top: 16px;}
  `]
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
  }
}
