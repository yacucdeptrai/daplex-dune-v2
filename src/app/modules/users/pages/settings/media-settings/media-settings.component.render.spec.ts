import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthService, UsersService } from '../../../../../core/services';
import { MediaSettingsComponent } from './media-settings.component';
import { provideTranslocoTesting } from '../../../../../../testing/test-helpers';

/**
 * v21 runtime render guard for media-settings (inputswitch->toggleswitch migration).
 *
 * Renders the three reactive-form p-toggleswitch controls (paused / prefAudioLang /
 * prefSubtitleLang) plus the p-sliderAlt fork control, un-stubbed. The global
 * console-error guard fails on any NG runtime error during initialization.
 */
describe('MediaSettingsComponent — v21 toggleswitch render', () => {
  let fixture: ComponentFixture<MediaSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaSettingsComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslocoTesting(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: UsersService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MediaSettingsComponent);
    fixture.detectChanges();
  });

  it('renders three p-toggleswitch controls in the v21 DOM', () => {
    const host: HTMLElement = fixture.nativeElement;
    const toggles = host.querySelectorAll('p-toggleswitch');
    expect(toggles.length).withContext('paused + prefAudioLang + prefSubtitleLang toggles').toBe(3);
    // v21 toggleswitch renders a checkbox input + slider span inside the host.
    const inputs = host.querySelectorAll('p-toggleswitch input[type="checkbox"]');
    expect(inputs.length).withContext('each toggleswitch renders its v21 checkbox input').toBe(3);
  });

  it('renders the p-sliderAlt fork control with no NG runtime error', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('p-slideralt, p-sliderAlt')).withContext('slideralt fork host present').toBeTruthy();
  });
});
