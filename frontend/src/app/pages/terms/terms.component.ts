import { Component, OnInit } from '@angular/core';
import { CommonModule,  } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

  ],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent implements OnInit {



  constructor() { }

  ngOnInit(): void {
  }

}
