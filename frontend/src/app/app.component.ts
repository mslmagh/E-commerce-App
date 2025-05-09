
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component'; // Yolu kontrol et
import { FooterComponent } from './core/layout/footer/footer.component'; // Yolu kontrol et

@Component({
  selector: 'app-root', // index.html'deki <app-root> etiketi
  standalone: true,    // Standalone component
  imports: [
      RouterOutlet,     // <router-outlet> için gerekli
      HeaderComponent,  // <app-header> için gerekli
      FooterComponent   // <app-footer> için gerekli
  ],
  templateUrl: './app.component.html', // Bu component'in HTML'i
  styleUrls: ['./app.component.css']    // Bu component'in CSS'i (Sticky footer için düzenlemiştik)
})
export class AppComponent {
  title = 'frontend'; // Veya projenin package.json'daki adı
}
