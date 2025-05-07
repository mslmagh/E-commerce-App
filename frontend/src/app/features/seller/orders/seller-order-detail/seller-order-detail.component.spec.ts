import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerOrderDetailComponent } from './seller-order-detail.component';

describe('SellerOrderDetailComponent', () => {
  let component: SellerOrderDetailComponent;
  let fixture: ComponentFixture<SellerOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerOrderDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
