// frontend/src/app/features/homepage/homepage.component.ts
import { Component, OnInit } from '@angular/core';
// *ngFor ve | currency pipe'ı için CommonModule gerekli
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homepage',
  standalone: true,
  // CommonModule'ü imports'a ekliyoruz
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'] // veya .scss
})
export class HomepageComponent implements OnInit {

  // Öne çıkan ürünler için sahte (mock) veri dizisi
  featuredProducts: any[] = [
    { id: 1, name: 'Kablosuz Kulaklık Pro X', price: 899, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Kulaklık' },
    { id: 2, name: 'Akıllı Saat Fit+', price: 1450, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Akıllı+Saat' },
    { id: 3, name: 'Mekanik Klavye RGB', price: 650, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Klavye' },
    { id: 4, name: 'Yoga Matı Kaymaz', price: 250, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Yoga+Matı' },
    { id: 5, name: 'Blender Seti PowerMix', price: 1100, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Blender' },
    { id: 6, name: 'Erkek Sneaker Air', price: 1999, imageUrl: 'https://via.placeholder.com/300x300/cccccc/ffffff?text=Sneaker' }
  ];

  constructor() { }

  ngOnInit(): void {
    // Component ilk yüklendiğinde yapılacaklar (şimdilik boş)
  }

}
