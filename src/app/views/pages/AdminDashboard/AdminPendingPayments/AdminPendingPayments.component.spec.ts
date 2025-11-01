import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPendingPaymentsComponent } from './AdminPendingPayments.component';

describe('PendingPaymentsComponent', () => {
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
