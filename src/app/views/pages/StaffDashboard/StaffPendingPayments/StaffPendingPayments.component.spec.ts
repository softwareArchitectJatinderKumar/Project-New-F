import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPendingPaymentsComponent } from '../../AdminDashboard/AdminPendingPayments/AdminPendingPayments.component';

describe('AdminPendingPaymentsComponent', () => {
  let component: AdminPendingPaymentsComponent;
  let fixture: ComponentFixture<AdminPendingPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminPendingPaymentsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPendingPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
