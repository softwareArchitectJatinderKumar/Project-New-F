import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AUploadProofStatusComponent } from './AUploadProofStatus.component';

describe('ASampleStatusComponent', () => {
  let component: AUploadProofStatusComponent;
  let fixture: ComponentFixture<AUploadProofStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AUploadProofStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AUploadProofStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
