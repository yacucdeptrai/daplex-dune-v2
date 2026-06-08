import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services';
import { UsersStateService } from '../../services';
import { ProfileComponent } from './profile.component';
import { HTTP_TEST_PROVIDERS, provideMockActivatedRoute } from '../../../../../testing/test-helpers';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [
        provideMockActivatedRoute(),
        { provide: UsersStateService, useValue: { user$: of(null), user: null } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        ...HTTP_TEST_PROVIDERS
    ]
})
      .overrideComponent(ProfileComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
