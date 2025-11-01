import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffUserLoginComponent } from './StaffUser-login.component';

describe('StaffUserLoginComponent', () => {
  let component: StaffUserLoginComponent;
  let fixture: ComponentFixture<StaffUserLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StaffUserLoginComponent]
    });
    fixture = TestBed.createComponent(StaffUserLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
