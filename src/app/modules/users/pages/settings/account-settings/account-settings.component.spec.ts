import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { AccountSettingsComponent } from './account-settings.component';

describe('AccountSettingsComponent', () => {
  let component: AccountSettingsComponent;
  let fixture: ComponentFixture<AccountSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccountSettingsComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
      ]
    })
      .overrideComponent(AccountSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(AccountSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
