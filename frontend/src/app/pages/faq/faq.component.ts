import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // NgFor, NgIf gibi direktifler için
import { RouterModule } from '@angular/router'; // routerLink için

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule // routerLink için
  ],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {

  faqs: FAQItem[] = [
    {
      id: 1,
      question: 'Nasıl sipariş verebilirim?',
      answer: 'Sipariş vermek çok kolay! Beğendiğiniz ürünleri sepetinize ekleyin, ardından sepetinize giderek "Siparişi Tamamla" butonuna tıklayın. Adres ve ödeme bilgilerinizi girdikten sonra siparişinizi onaylayabilirsiniz.'
    },
    {
      id: 2,
      question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
      answer: 'Kredi kartı, banka kartı ve [varsa diğer ödeme yöntemleri, örn: EFT/Havale, Kapıda Ödeme] ile ödeme yapabilirsiniz. Tüm ödemeleriniz güvenli altyapımız üzerinden gerçekleştirilir.'
    },
    {
      id: 3,
      question: 'Siparişim ne zaman kargoya verilir?',
      answer: 'Siparişleriniz genellikle 1-3 iş günü içerisinde hazırlanarak kargoya teslim edilir. Kargoya verildiğinde size bilgilendirme e-postası ve SMS gönderilecektir.'
    },
    {
      id: 4,
      question: 'Kargo ücreti ne kadar?',
      answer: '[Kargo ücret politikanızı buraya yazın. Örneğin: "250 TL ve üzeri alışverişlerinizde kargo ücretsizdir. Bu tutarın altındaki siparişler için sabit 25 TL kargo ücreti uygulanır."]'
    },
    {
      id: 5,
      question: 'Siparişimi nasıl takip edebilirim?',
      answer: 'Siparişiniz kargoya verildikten sonra size gönderilecek olan kargo takip numarası ile ilgili kargo firmasının web sitesi üzerinden veya "Hesabım > Siparişlerim" bölümünden siparişinizi takip edebilirsiniz.'
    },
    {
      id: 6,
      question: 'Ürün iadesi veya değişimi yapabilir miyim?',
      answer: 'Evet, kullanılmamış ve orijinal ambalajı bozulmamış ürünlerinizi teslim tarihinden itibaren 14 gün içerisinde iade edebilir veya değişim talep edebilirsiniz. Detaylı bilgi için lütfen "İade & Değişim" sayfamızı ziyaret edin.'
    }
    // İhtiyaç duyduğunuz kadar soru ve cevap ekleyebilirsiniz.
  ];

  constructor() { }

  ngOnInit(): void {
  }

  trackById(index: number, item: FAQItem): number {
    return item.id;
  }
}
