// frontend/src/app/features/auth/login/login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Reactive Forms için GEREKLİ importlar:
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  // ReactiveFormsModule'ün burada olması ÇOK ÖNEMLİ:
  imports: [
    CommonModule,
    ReactiveFormsModule // Form direktiflerinin çalışması için gerekli
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // Form grubumuz (HTML'deki [formGroup] ile aynı isimde olmalı)
  loginForm!: FormGroup;

  constructor() { } // Constructor şimdilik boş kalabilir

  ngOnInit(): void {
    // Component yüklendiğinde formu ve kontrollerini oluşturuyoruz
    this.loginForm = new FormGroup({
      // email kontrolü: başlangıç değeri null, Zorunlu ve Email formatında olmalı
      'email': new FormControl(null, [Validators.required, Validators.email]),
      // password kontrolü: başlangıç değeri null, Zorunlu olmalı
      'password': new FormControl(null, Validators.required)
    });

    // Formun başlangıçtaki durumunu görmek için konsola yazdıralım (DEBUG)
    console.log('Initial Form Status:', this.loginForm.status);
    // this.loginForm.statusChanges.subscribe(status => { // Durum değişimlerini izlemek için (DEBUG)
    //   console.log('Form Status Changed:', status);
    // });
  }

  // Form gönderildiğinde çalışacak fonksiyon (HTML'deki (ngSubmit) ile bağlanacak)
  onSubmit(): void {
    console.log('onSubmit triggered!'); // Metodun çalıştığını görelim
    if (this.loginForm.valid) {
      console.log('Form is valid');
      console.log('Form Values:', this.loginForm.value);
      // İleride: this.authService.login(...) çağrılacak
    } else {
      console.log('Form is invalid');
      // Kullanıcıya uyarı gösterme veya geçersiz alanları işaretleme işlemleri yapılabilir
      // Örnek: this.loginForm.markAllAsTouched();
    }
  }

  // Template'den kolay erişim için getter'lar (isteğe bağlı)
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
