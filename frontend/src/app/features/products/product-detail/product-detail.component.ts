import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { Product, ProductService } from '../../../core/services/product.service'; // Yolu Kontrol Et!
// import { CartService } from '../../../core/services/cart.service'; // Sepete ekleme için ileride

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink], // RouterLink eklendi
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'] // veya .scss
})
export class ProductDetailComponent implements OnInit {

  product$: Observable<Product | undefined> = of(undefined);

  constructor(
    private route: ActivatedRoute, // Aktif route bilgisini almak için
    private productService: ProductService // Ürün servisini kullanmak için
    // private cartService: CartService // İleride eklenecek
    // private router: Router // Belki başka sayfaya yönlendirme için ileride
  ) { }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    console.log('ProductDetailComponent: Found productId from route:', productId);

    if (productId) {
      this.product$ = this.productService.getProductById(productId);
    } else {
      console.error('Product ID not found in route parameters!');
      // Opsiyonel: Hata durumunda kullanıcıyı başka sayfaya yönlendir
      // this.router.navigate(['/']);
    }
  }

  // addToCart(product: Product): void { // Bu metodu ileride ekleyeceğiz
  //   if(product) {
  //      console.log('ProductDetail: Adding to cart:', product.name);
  //      this.cartService.addToCart(product);
  //      this.router.navigate(['/cart']);
  //   }
  // }
}
