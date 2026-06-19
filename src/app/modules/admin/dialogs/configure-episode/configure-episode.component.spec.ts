import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ConfigureEpisodeComponent } from './configure-episode.component';
import { ConfirmActionService, MediaFormHelperService, MediaScannerService, MediaService, QueueUploadService } from '../../../../core/services';
import { ScannerEpisode } from '../../../../core/models';
import { secondsToTimeString } from '../../../../core/utils';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

const SCANNED: ScannerEpisode = { episodeNumber: 5, name: 'Scanned', overview: 'A scanned overview', runtime: 1500, airDate: '2021-05-01' };

function makeMedia(overrides: any = {}) {
  return { _id: 'm1', externalIds: { tmdb: 42 }, scanner: { enabled: true, tvSeason: 2 }, ...overrides };
}

// The real MediaFormHelperService pulls in HTTP-backed genre/tag services (HttpCacheManager), so it is
// mocked here; the spy performs the same name/overview/runtime/airDate patch its real mapper does, which
// is independently covered by media-form-helper.service.spec.ts.
function mockMediaFormHelper() {
  return {
    applyScannedEpisode: jasmine.createSpy('applyScannedEpisode').and.callFake((form: any, episode: ScannerEpisode) => {
      form.patchValue({
        name: episode.name,
        overview: episode.overview || '',
        runtime: Number.isFinite(episode.runtime) ? secondsToTimeString(episode.runtime) : '00:00:00'
      });
      const [year, month, day] = (episode.airDate || '').split('-').map(Number);
      if (year && month && day) form.controls.airDate.patchValue({ day, month, year });
    })
  };
}

function setup(media: any) {
  return TestBed.configureTestingModule({
    imports: [ConfigureEpisodeComponent],
    providers: [
      { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
      { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ media, episode: { _id: 'e1', epNumber: 3 } }) },
      { provide: DialogService, useValue: mockDialogService() },
      ConfirmationService,
      ConfirmActionService,
      { provide: MediaService, useValue: { findOneTVEpisode: () => of() } },
      { provide: MediaScannerService, useValue: { findEpisode: jasmine.createSpy('findEpisode').and.returnValue(of(SCANNED)) } },
      { provide: MediaFormHelperService, useValue: mockMediaFormHelper() },
      { provide: QueueUploadService, useValue: {} },
      { provide: TranslocoService, useValue: mockTranslocoService() }
    ]
  });
}

describe('ConfigureEpisodeComponent', () => {
  let component: ConfigureEpisodeComponent;
  let fixture: ComponentFixture<ConfigureEpisodeComponent>;
  let scanner: jasmine.SpyObj<MediaScannerService>;

  function create(media: any) {
    setup(media).overrideComponent(ConfigureEpisodeComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    scanner = TestBed.inject(MediaScannerService) as jasmine.SpyObj<MediaScannerService>;
    fixture.detectChanges();
  }

  it('should create', () => {
    create(makeMedia());
    expect(component).toBeTruthy();
  });

  it('canScanEpisode is true with a tmdb id and a set tvSeason', () => {
    create(makeMedia());
    expect(component.canScanEpisode).toBeTrue();
  });

  it('canScanEpisode is false without a tmdb id', () => {
    create(makeMedia({ externalIds: {} }));
    expect(component.canScanEpisode).toBeFalse();
  });

  it('canScanEpisode is false without a tvSeason', () => {
    create(makeMedia({ scanner: { enabled: true } }));
    expect(component.canScanEpisode).toBeFalse();
  });

  it('scanEpisode calls findEpisode with (tmdb, tvSeason, epNumber, {provider:tmdb})', () => {
    create(makeMedia());
    component.episode = { epNumber: 3 } as any;
    component.scanEpisode();
    expect(scanner.findEpisode).toHaveBeenCalledWith(42, 2, 3, { provider: 'tmdb' });
  });

  it('scanEpisode fills the form and arms the footer WITHOUT re-snapshotting the init value', () => {
    create(makeMedia());
    component.episode = { epNumber: 3 } as any;
    const initBefore = component.updateEpisodeInitValue;
    component.scanEpisode();
    expect(component.updateEpisodeForm.controls.name.value).toBe('Scanned');
    expect(component.updateEpisodeFormChanged).toBeTrue();
    expect(component.updateEpisodeInitValue).toBe(initBefore);
  });

  it('scanEpisode early-returns when gated (no tvSeason) — findEpisode not called', () => {
    create(makeMedia({ scanner: { enabled: true } }));
    component.episode = { epNumber: 3 } as any;
    component.scanEpisode();
    expect(scanner.findEpisode).not.toHaveBeenCalled();
  });

  it('scanEpisode early-returns while a scan is already in flight', () => {
    create(makeMedia());
    component.episode = { epNumber: 3 } as any;
    component.isScanning = true;
    component.scanEpisode();
    expect(scanner.findEpisode).not.toHaveBeenCalled();
  });
});
