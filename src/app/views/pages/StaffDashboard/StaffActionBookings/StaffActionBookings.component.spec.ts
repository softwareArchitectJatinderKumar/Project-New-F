import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffActionBookingsComponent } from './StaffActionBookings.component';

describe('StaffActionBookingsComponent', () => {
  let component: StaffActionBookingsComponent;
  let fixture: ComponentFixture<StaffActionBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StaffActionBookingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StaffActionBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
