// frontend/src/app/app.component.ts
import { Component } from '@angular/core';
// RouterOutlet genellikle zaten import edilmiştir standalone projelerde
import { RouterOutlet } from '@angular/router';
// Yeni oluşturduğumuz Header ve Footer component'lerini import ediyoruz
// !!! Yolları kontrol et, app.component.ts'e göre doğru olmalı !!!
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // imports dizisine RouterOutlet YANINA HeaderComponent ve FooterComponent'i ekliyoruz:
  imports: [
      RouterOutlet,
      HeaderComponent, // <-- EKLENDİ
      FooterComponent  // <-- EKLENDİ
      // Muhtemelen CommonModule gibi başka importlar da olabilir veya eklenebilir
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // veya .scss
})
export class AppComponent {
  // title özelliği genellikle başlangıç projesinde olur, kalabilir veya silebilirsin
  title = 'frontend'; // Veya proje adın neyse
}
