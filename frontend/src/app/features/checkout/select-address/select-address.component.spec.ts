import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAddressComponent } from './select-address.component';

describe('SelectAddressComponent', () => {
  let component: SelectAddressComponent;
  let fixture: ComponentFixture<SelectAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectAddressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
