import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateInstrumentPriceComponent } from './UpdateInstrumentPrice.component';

describe('UpdateInstrumentPriceComponent', () => {
  let component: UpdateInstrumentPriceComponent;
  let fixture: ComponentFixture<UpdateInstrumentPriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateInstrumentPriceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateInstrumentPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
