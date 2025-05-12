import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngFor, *ngIf gibi direktifler için
import { RouterModule } from '@angular/router'; // routerLink için

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule // routerLink için
  ],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.css'
})
export class ReturnsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
