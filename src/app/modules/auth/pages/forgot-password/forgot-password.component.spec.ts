import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ForgotPasswordComponent } from './forgot-password.component';
import { provideTranslocoTesting } from '../../../../../testing/test-helpers';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ForgotPasswordComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [provideTranslocoTesting()]
})
    .overrideComponent(ForgotPasswordComponent, { set: { template: '' } })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
