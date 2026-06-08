import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

import { SignUpComponent } from './sign-up.component';
import { AuthService } from '../../../../core/services';
import {
  provideMockActivatedRoute,
  mockRouter,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, SignUpComponent],
    providers: [
        provideMockActivatedRoute({ queryParams: {} }),
        { provide: Router, useValue: mockRouter() },
        { provide: AuthService, useValue: {} },
        { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
})
      .overrideComponent(SignUpComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
