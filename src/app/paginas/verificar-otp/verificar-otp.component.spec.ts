import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificarOtpComponent } from './verificar-otp.component';

describe('VerificarOtpComponent', () => {
  let component: VerificarOtpComponent;
  let fixture: ComponentFixture<VerificarOtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificarOtpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificarOtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
