import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@ngneat/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { ProfileSettingsComponent } from './profile-settings.component';
import { mockTranslocoService } from '../../../../../../testing/test-helpers';

describe('ProfileSettingsComponent', () => {
  let component: ProfileSettingsComponent;
  let fixture: ComponentFixture<ProfileSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ProfileSettingsComponent],
    providers: [
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: DialogService, useValue: { open: () => undefined, dialogComponentRefMap: new Map() } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(ProfileSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateProfileForm).toBeTruthy();
  });
});
