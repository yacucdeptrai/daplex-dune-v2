import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../../core/services';
import { provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, ResetPasswordComponent],
    providers: [
        provideMockActivatedRoute({ queryParams: {} }),
        { provide: AuthService, useValue: {} }
    ]
})
      .overrideComponent(ResetPasswordComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
