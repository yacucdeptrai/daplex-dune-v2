import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../../../core/services';
import { provideMockActivatedRoute, mockRouter } from '../../../../../testing/test-helpers';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ReactiveFormsModule, SignInComponent],
    providers: [
        provideMockActivatedRoute({ queryParams: {} }),
        { provide: Router, useValue: mockRouter() },
        { provide: AuthService, useValue: { currentUser$: of(null) } }
    ]
})
      .overrideComponent(SignInComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
