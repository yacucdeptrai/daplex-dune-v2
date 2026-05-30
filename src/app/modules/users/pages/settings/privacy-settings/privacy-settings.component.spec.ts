import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { PrivacySettingsComponent } from './privacy-settings.component';

describe('PrivacySettingsComponent', () => {
  let component: PrivacySettingsComponent;
  let fixture: ComponentFixture<PrivacySettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacySettingsComponent],
      providers: [
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
      ]
    })
      .overrideComponent(PrivacySettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(PrivacySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updatePrivacyForm).toBeTruthy();
  });
});
