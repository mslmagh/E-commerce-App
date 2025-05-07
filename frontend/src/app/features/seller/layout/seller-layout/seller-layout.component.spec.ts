import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerLayoutComponent } from './seller-layout.component';

describe('SellerLayoutComponent', () => {
  let component: SellerLayoutComponent;
  let fixture: ComponentFixture<SellerLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
