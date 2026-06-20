import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subject, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { ConfigureEpisodeComponent } from './configure-episode.component';
import { ConfirmActionService, MediaFormHelperService, MediaScannerService, MediaService, QueueUploadService } from '../../../../core/services';
import { ScannerEpisode } from '../../../../core/models';
import { ToastKey } from '../../../../core/enums';
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
      MessageService,
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

describe('ConfigureEpisodeComponent — import still from provider', () => {
  let component: ConfigureEpisodeComponent;
  let fixture: ComponentFixture<ConfigureEpisodeComponent>;
  let mediaService: any;
  let scannerService: any;
  let messageService: MessageService;

  const MEDIA_ID = 'm1';
  const EPISODE_ID = 'e1';
  const STILL_EPISODE: ScannerEpisode = { episodeNumber: 5, name: 'Ep 5', overview: 'x', runtime: 1200, airDate: '2020-01-01', stillUrl: 'https://image.tmdb.org/still.jpg' };

  function importMedia(overrides: any = {}) {
    return { _id: MEDIA_ID, externalIds: { tmdb: 603 }, scanner: { enabled: true, tvSeason: 1 }, ...overrides };
  }
  function importEpisode(overrides: any = {}) {
    return { _id: EPISODE_ID, epNumber: 5, name: 'Ep 5', subtitles: [], airDate: { day: 1, month: 1, year: 2020 }, ...overrides };
  }

  function create(media: any = importMedia(), episode: any = importEpisode()) {
    mediaService = {
      findOneTVEpisode: jasmine.createSpy('findOneTVEpisode').and.returnValue(of(episode)),
      uploadStillFromUrl: jasmine.createSpy('uploadStillFromUrl').and.returnValue(of({ stillUrl: 'https://r2/new-still.jpg' }))
    };
    scannerService = { findEpisode: jasmine.createSpy('findEpisode').and.returnValue(of(STILL_EPISODE)) };
    TestBed.configureTestingModule({
      imports: [ConfigureEpisodeComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ media, episode }) },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        MessageService,
        { provide: MediaService, useValue: mediaService },
        { provide: MediaScannerService, useValue: scannerService },
        { provide: MediaFormHelperService, useValue: { applyScannedEpisode: () => undefined } },
        { provide: QueueUploadService, useValue: { isMediaInQueue: () => false } },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    }).overrideComponent(ConfigureEpisodeComponent, { set: { template: '', imports: [] } });
    fixture = TestBed.createComponent(ConfigureEpisodeComponent);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
    fixture.detectChanges();
  }

  it('importStill no-ops (no fetch) when the episode is not scannable', () => {
    create(importMedia({ externalIds: {}, scanner: { enabled: true } }));
    component.importStill();
    expect(scannerService.findEpisode).not.toHaveBeenCalled();
    expect(mediaService.uploadStillFromUrl).not.toHaveBeenCalled();
  });

  it('importStill fetches the provider episode with (tmdb, season, epNumber, {provider:tmdb})', () => {
    create();
    component.importStill();
    expect(scannerService.findEpisode).toHaveBeenCalledWith(603, 1, 5, { provider: 'tmdb' });
  });

  it('importStill uploads the provider stillUrl, merges the partial episode, and marks updated', () => {
    create();
    component.importStill();
    expect(mediaService.uploadStillFromUrl).toHaveBeenCalledWith(MEDIA_ID, EPISODE_ID, 'https://image.tmdb.org/still.jpg');
    expect(component.episode!.stillUrl).toBe('https://r2/new-still.jpg');
    expect(component.episode!.name).toBe('Ep 5');
    expect(component.isUpdated).toBeTrue();
    expect(component.isImportingStill).toBeFalse();
  });

  it('importStill surfaces an info toast and does NOT upload when the provider has no still', () => {
    create();
    scannerService.findEpisode.and.returnValue(of({ ...STILL_EPISODE, stillUrl: undefined }));
    const addSpy = spyOn(messageService, 'add');
    component.importStill();
    expect(mediaService.uploadStillFromUrl).not.toHaveBeenCalled();
    expect(component.isUpdated).toBeFalse();
    const msg = addSpy.calls.mostRecent().args[0];
    expect(msg.key).toBe(ToastKey.APP);
    expect(msg.severity).toBe('info');
    expect(msg.detail).toBe('admin.configureEpisode.noProviderStill');
    expect(component.isImportingStill).toBeFalse();
  });

  it('importStill is re-entrancy guarded while a previous import is in flight', () => {
    create();
    scannerService.findEpisode.and.returnValue(new Subject());
    component.importStill();
    expect(component.isImportingStill).toBeTrue();
    component.importStill();
    expect(scannerService.findEpisode).toHaveBeenCalledTimes(1);
  });

  // 2a regression: the loading flag must span the provider lookup AND the upload as one phase. A deferred
  // lookup + delayed upload exercises the two legs; a synchronous of(...) would let an early drop slip by.
  it('keeps isImportingStill true across both async legs, clearing only when the upload settles', fakeAsync(() => {
    create();
    const find$ = new Subject<any>();
    scannerService.findEpisode.and.returnValue(find$.asObservable());
    mediaService.uploadStillFromUrl.and.returnValue(of({ stillUrl: 'https://r2/new.jpg' }).pipe(delay(10)));

    component.importStill();
    expect(component.isImportingStill).withContext('held during provider lookup').toBeTrue();
    expect(mediaService.uploadStillFromUrl).not.toHaveBeenCalled();

    find$.next(STILL_EPISODE);
    find$.complete();
    // lookup resolved, upload in flight -> flag still held (NOT dropped by the lookup finalizer)
    expect(mediaService.uploadStillFromUrl).toHaveBeenCalled();
    expect(component.isImportingStill).withContext('held during upload').toBeTrue();

    tick(10);
    expect(component.isImportingStill).withContext('cleared after upload settles').toBeFalse();
  }));

  it('clears isImportingStill via the lookup finalizer on the no-still branch (no upload started)', fakeAsync(() => {
    create();
    const find$ = new Subject<any>();
    scannerService.findEpisode.and.returnValue(find$.asObservable());
    spyOn(messageService, 'add');

    component.importStill();
    expect(component.isImportingStill).toBeTrue();

    find$.next({ ...STILL_EPISODE, stillUrl: undefined });
    find$.complete();
    expect(mediaService.uploadStillFromUrl).not.toHaveBeenCalled();
    expect(component.isImportingStill).withContext('cleared by lookup finalizer when no upload started').toBeFalse();
  }));
});
