import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './shipping.component.html',
  styleUrl: './shipping.component.css'
})
export class ShippingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
