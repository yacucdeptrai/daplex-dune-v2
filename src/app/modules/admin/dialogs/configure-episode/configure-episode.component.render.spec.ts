import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ConfigureEpisodeComponent } from './configure-episode.component';
import { ConfirmActionService, MediaFormHelperService, MediaScannerService, MediaService, QueueUploadService } from '../../../../core/services';
import { TVEpisodeDetails } from '../../../../core/models';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

// Live render of the episode editor with MediaService + MediaScannerService MOCKED. The disabled-when-
// ungated branch is the authoritative assertion (no tmdb id / no tvSeason -> the Scan button is disabled);
// the positive-fill path is exercised in the logic spec + the integration render gate.

const EPISODE = {
  _id: 'e1', epNumber: 3, name: 'Ep Three', overview: 'An overview long enough', runtime: 1320,
  airDate: { day: 1, month: 1, year: 2020 }, visibility: 1, status: 0, subtitles: [],
  stillUrl: undefined, thumbnailStillUrl: undefined, stillPlaceholder: undefined
} as unknown as TVEpisodeDetails;

function scanButton(host: HTMLElement): HTMLButtonElement | null {
  return host.querySelector('button .ms-cloud-download')?.closest('button') as HTMLButtonElement | null;
}

// The import-still button shares the cloud-download icon with Scan, so disambiguate by accessible name.
function importStillButton(host: HTMLElement): HTMLButtonElement | null {
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('button[aria-label]'));
  return buttons.find(b => b.getAttribute('aria-label') === 'admin.configureEpisode.importStill') ?? null;
}

function setup(media: any) {
  TestBed.configureTestingModule({
    imports: [ConfigureEpisodeComponent],
    providers: [
      provideNoopAnimations(),
      { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
      { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ media, episode: { _id: 'e1', epNumber: 3 } }) },
      { provide: DialogService, useValue: mockDialogService() },
      ConfirmationService,
      ConfirmActionService,
      MessageService,
      { provide: MediaService, useValue: { findOneTVEpisode: () => of(EPISODE) } },
      { provide: MediaScannerService, useValue: { findEpisode: jasmine.createSpy('findEpisode').and.returnValue(of()) } },
      { provide: MediaFormHelperService, useValue: { applyScannedEpisode: () => undefined } },
      { provide: QueueUploadService, useValue: { isMediaInQueue: () => false } },
      provideTranslocoTesting()
    ]
  });
}

describe('ConfigureEpisodeComponent (live render, mocked services)', () => {
  let fixture: ComponentFixture<ConfigureEpisodeComponent>;
  let component: ConfigureEpisodeComponent;

  afterEach(() => fixture?.destroy());

  // Ungated uses aria-disabled (NOT native disabled) so the button stays focusable and the reason reaches AT.
  it('renders the Scan button aria-disabled + focusable + describedby when ungated (no tmdb id)', () => {
    setup({ _id: 'm1', externalIds: {}, scanner: { enabled: true } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = scanButton(host);
    expect(component.canScanEpisode).withContext('gate is closed without a tmdb id').toBeFalse();
    expect(button).withContext('the Scan button renders on the general tab').toBeTruthy();
    expect(button?.getAttribute('aria-disabled')).withContext('aria-disabled, not native disabled').toBe('true');
    expect(button?.hasAttribute('disabled')).withContext('NOT natively disabled (stays focusable)').toBeFalse();
    expect(button?.getAttribute('aria-label')).withContext('has an accessible name').toBeTruthy();
    const describedBy = button?.getAttribute('aria-describedby');
    expect(describedBy).withContext('points at the hint').toBe('scan-disabled-hint');
    const hint = host.querySelector('#scan-disabled-hint');
    expect(hint).withContext('the reason hint is rendered').toBeTruthy();
    expect(hint?.textContent?.trim().length).withContext('hint carries text').toBeGreaterThan(0);
  });

  it('renders the Scan button ENABLED (no aria-disabled, no hint) when gated open (tmdb id + tvSeason)', () => {
    setup({ _id: 'm1', externalIds: { tmdb: 42 }, scanner: { enabled: true, tvSeason: 2 } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = scanButton(host);
    expect(component.canScanEpisode).toBeTrue();
    expect(button?.getAttribute('aria-disabled')).withContext('not aria-disabled when gated open').toBe('false');
    expect(button?.hasAttribute('disabled')).toBeFalse();
    expect(button?.getAttribute('aria-describedby')).withContext('no hint when actionable').toBeNull();
    expect(host.querySelector('#scan-disabled-hint')).toBeNull();
  });

  // The still-section import button mirrors the Scan gating: aria-disabled (focusable) + describedby hint
  // when there is no tmdb id / tvSeason.
  it('renders the import-still button aria-disabled + focusable + describedby when ungated', () => {
    setup({ _id: 'm1', externalIds: {}, scanner: { enabled: true } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = importStillButton(host);
    expect(component.canScanEpisode).toBeFalse();
    expect(button).withContext('the import-still button renders in the still section').toBeTruthy();
    expect(button?.getAttribute('aria-disabled')).withContext('aria-disabled, not native disabled').toBe('true');
    expect(button?.hasAttribute('disabled')).withContext('NOT natively disabled (stays focusable)').toBeFalse();
    expect(button?.getAttribute('aria-describedby')).withContext('points at the hint').toBe('import-still-disabled-hint');
    const hint = host.querySelector('#import-still-disabled-hint');
    expect(hint).withContext('the reason hint is rendered').toBeTruthy();
    expect(hint?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('renders the import-still button ENABLED (no aria-disabled, no hint) when gated open', () => {
    setup({ _id: 'm1', externalIds: { tmdb: 42 }, scanner: { enabled: true, tvSeason: 2 } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = importStillButton(host);
    expect(component.canScanEpisode).toBeTrue();
    expect(button?.getAttribute('aria-disabled')).withContext('not aria-disabled when gated open').toBe('false');
    expect(button?.hasAttribute('disabled')).toBeFalse();
    expect(button?.getAttribute('aria-describedby')).withContext('no hint when actionable').toBeNull();
    expect(host.querySelector('#import-still-disabled-hint')).toBeNull();
  });
});
