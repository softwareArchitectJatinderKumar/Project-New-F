import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleStatusComponent } from './UploadProofStatus.component';

describe('SampleStatusComponent', () => {
  let component: SampleStatusComponent;
  let fixture: ComponentFixture<SampleStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
