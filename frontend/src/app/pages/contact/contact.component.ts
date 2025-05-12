import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Gerekli
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Form için
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-contact',
  standalone: true, // Standalone olarak işaretle
  imports: [
    CommonModule,
    ReactiveFormsModule, // Reactive Forms için
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'] // CSS dosyasını bağla
})
export class ContactComponent implements OnInit {

  contactForm!: FormGroup; // FormGroup tanımla

  constructor(
    private fb: FormBuilder, // FormBuilder'ı inject et
    private snackBar: MatSnackBar // Snackbar'ı inject et
  ) {}

  ngOnInit(): void {
    // Formu ilklendir (Angular Material form alanlarını kullanıyorsak,
    // HTML'de [(ngModel)] yerine [formGroup] ve formControlName kullanacağız)
    // Şimdilik HTML'de basit bir form bıraktım, isterseniz Material'a çevirebiliriz.
    // Bu .ts dosyası şimdilik HTML'deki name="" attributelarına göre bir submit fonksiyonu içeriyor.
  }

  onFormSubmit(event: Event): void {
    event.preventDefault(); // Formun sayfa yenilemesini engelle
    const form = event.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const subject = (form.elements.namedItem('subject') as HTMLInputElement)?.value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement)?.value;

    if (name && email && subject && message) {
      console.log('Form Verileri:', { name, email, subject, message });
      // Burada normalde bir servise gönderim yapılır.
      this.snackBar.open('Mesajınız başarıyla gönderildi!', 'Tamam', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      form.reset(); // Formu temizle
    } else {
      this.snackBar.open('Lütfen tüm alanları doldurun.', 'Kapat', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'] // Opsiyonel: Hata için farklı stil
      });
    }
  }
}
