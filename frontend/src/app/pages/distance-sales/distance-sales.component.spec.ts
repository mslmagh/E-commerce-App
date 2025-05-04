import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistanceSalesComponent } from './distance-sales.component';

describe('DistanceSalesComponent', () => {
  let component: DistanceSalesComponent;
  let fixture: ComponentFixture<DistanceSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistanceSalesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistanceSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
