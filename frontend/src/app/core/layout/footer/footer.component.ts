// frontend/src/app/core/layout/footer/footer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  // CommonModule {{ currentYear }} gibi temel Angular özellikleri için gerekebilir.
  imports: [CommonModule,RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'] // veya .scss
})
export class FooterComponent {
  // O anki yılı almak için Date objesini kullanıyoruz
  currentYear: number = new Date().getFullYear();

  constructor() { }

  // ngOnInit() { } // Şimdilik ngOnInit'e gerek yok
}
