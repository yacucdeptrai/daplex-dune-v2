import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { UserDetails } from '../../../../../core/models';
import { MediaSettingsComponent } from './media-settings.component';
import {
  mockTranslocoService, provideTranslocoTesting, HTTP_TEST_PROVIDERS
} from '../../../../../../testing/test-helpers';

describe('MediaSettingsComponent', () => {
  let component: MediaSettingsComponent;
  let fixture: ComponentFixture<MediaSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaSettingsComponent],
    providers: [
        { provide: TranslocoService, useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) } },
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
    ]
})
      .overrideComponent(MediaSettingsComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(MediaSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.updateMediaForm).toBeTruthy();
  });
});

// Builds a UserDetails whose player.autoNext can be toggled per test.
function userWithAutoNext(autoNext: boolean | undefined): UserDetails {
  return {
    _id: 'u1', username: 'tester', roles: [], banned: false,
    lastActiveAt: '', createdAt: '',
    settings: {
      player: { autoNext, prefAudioLang: false, prefAudioLangList: ['default'], prefSubtitleLang: false, prefSubtitleLangList: ['default'] },
      subtitle: {}, history: { limit: 90, paused: false }, playlist: { visibility: 0 },
      rating: {}, historyList: { visibility: 0 }, playlistList: {}, ratingList: { visibility: 0 }
    } as UserDetails['settings']
  };
}

describe('MediaSettingsComponent autoNext wiring', () => {
  let component: MediaSettingsComponent;
  let fixture: ComponentFixture<MediaSettingsComponent>;
  let updateSettings: jasmine.Spy;

  async function setup(user: UserDetails): Promise<void> {
    updateSettings = jasmine.createSpy('updateSettings').and.returnValue(of(user.settings));
    await TestBed.configureTestingModule({
      imports: [MediaSettingsComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        ...provideTranslocoTesting({
          users: { mediaSettings: { autoNext: 'Auto-play next episode' } }
        }),
        { provide: AuthService, useValue: { currentUser$: of(user), currentUser: user } },
        { provide: UsersService, useValue: { updateSettings } }
      ]
    }).compileComponents();
    await TestBed.inject(TranslocoService).load('en');
    fixture = TestBed.createComponent(MediaSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders an accessible autoNext toggle with the i18n label and description link', async () => {
    await setup(userWithAutoNext(false));
    const toggle: HTMLElement = fixture.nativeElement.querySelector('[formcontrolname="autoNext"]');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-describedby')).toBe('auto-next-desc');
    expect(fixture.nativeElement.querySelector('#auto-next-desc')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Auto-play next episode');
  });

  it('patches the form from user.settings.player.autoNext', async () => {
    await setup(userWithAutoNext(true));
    expect(component.updateMediaForm.controls.autoNext.value).toBe(true);
  });

  it('defaults the toggle OFF when autoNext is undefined', async () => {
    await setup(userWithAutoNext(undefined));
    expect(component.updateMediaForm.controls.autoNext.value).toBe(false);
  });

  it('includes player.autoNext in the update payload on submit', async () => {
    await setup(userWithAutoNext(false));
    component.updateMediaForm.controls.autoNext.setValue(true);
    component.onUpdateMediaFormSubmit();
    expect(updateSettings).toHaveBeenCalled();
    const body = updateSettings.calls.mostRecent().args[1];
    expect(body.player.autoNext).toBe(true);
  });
});
