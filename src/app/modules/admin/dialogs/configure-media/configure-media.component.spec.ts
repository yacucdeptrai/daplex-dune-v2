import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of, throwError, Subject, config as rxConfig } from 'rxjs';

import { ConfigureMediaComponent } from './configure-media.component';
import { ConfirmActionService, GenresService, MediaService, ProductionsService, TagsService } from '../../../../core/services';
import { WsService } from '../../../../shared/modules/ws';
import { MediaPStatus, MediaSourceStatus, MediaStatus, MediaType } from '../../../../core/enums';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

/**
 * Characterization tests for ConfigureMediaComponent (Phase 7.3 decomposition).
 *
 * These lock the CURRENT (pre-split) observable behavior so the surgeon can extract
 * ConfigureMediaImagesComponent (and the 5 other concern children) without changing
 * what the monolith does. They assert WHAT THE CODE DOES TODAY, not what is ideal.
 *
 * The template is stubbed (`overrideComponent` -> empty template/imports), matching the
 * original smoke spec: behavior is exercised through component methods + injected service
 * spies, never through rendered DOM. That keeps the net stable across the UI split.
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

/** Minimal MOVIE-shaped MediaDetails sufficient for the Images/parent handlers under test. */
function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID,
    type: MediaType.MOVIE,
    title: MEDIA_TITLE,
    originalTitle: '',
    overview: 'an overview long enough',
    originalLang: 'en',
    genres: [],
    studios: [],
    producers: [],
    tags: [],
    runtime: 3600,
    adult: false,
    releaseDate: { day: 1, month: 1, year: 2020 },
    visibility: 1,
    status: MediaStatus.RELEASED,
    pStatus: MediaPStatus.DONE,
    externalIds: { tmdb: null, imdb: null, aniList: null, mal: null },
    scanner: { enabled: false },
    videos: [],
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    // image fields the delete handlers clear
    posterUrl: 'p', thumbnailPosterUrl: 'tp', smallPosterUrl: 'sp', fullPosterUrl: 'fp',
    posterColor: 1, posterPlaceholder: 'pp',
    backdropUrl: 'b', thumbnailBackdropUrl: 'tb', smallBackdropUrl: 'sb', fullBackdropUrl: 'fb',
    backdropColor: 2, backdropPlaceholder: 'bp',
    ...overrides
  };
}

describe('ConfigureMediaComponent', () => {
  let component: ConfigureMediaComponent;
  let fixture: ComponentFixture<ConfigureMediaComponent>;

  // Service test doubles captured per-test so specs can assert calls / drive callbacks.
  let mediaService: any;
  let dialogService: any;
  let confirmationService: ConfirmationService;

  // The component subscribes to several streams with a next-only handler. On an HTTP error
  // (only deliberately induced in the loadMedia-error spec) RxJS reports an *async* unhandled
  // error on a later macrotask — after the triggering spec's afterEach. Restoring per-test lets
  // that deferred report escape and disconnect Karma, so the guard stays installed for the whole
  // file and is restored only in afterAll. Every assertion still runs against real behavior.
  let originalOnUnhandledError: ((err: any) => void) | undefined;
  beforeAll(() => {
    originalOnUnhandledError = rxConfig.onUnhandledError ?? undefined;
    rxConfig.onUnhandledError = () => { /* expected async report from next-only subscribe */ };
  });
  afterAll(() => {
    rxConfig.onUnhandledError = originalOnUnhandledError ?? null;
  });

  function configure(configData: any = { _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE }) {
    mediaService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of(makeMovieMedia())),
      update: jasmine.createSpy('update').and.returnValue(of(makeMovieMedia())),
      deleteMovieSubtitle: jasmine.createSpy('deleteMovieSubtitle').and.returnValue(of(undefined)),
      findMovieStreams: jasmine.createSpy('findMovieStreams').and.returnValue(of({})),
      deleteMovieSource: jasmine.createSpy('deleteMovieSource').and.returnValue(of(undefined))
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaComponent],
      providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig(configData) },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: GenresService, useValue: { findGenreSuggestions: () => of([]) } },
        { provide: ProductionsService, useValue: { findProductionSuggestions: () => of([]) } },
        { provide: TagsService, useValue: { findTagSuggestions: () => of([]) } },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        {
          provide: TranslocoService,
          useValue: { ...mockTranslocoService(), selectTranslation: () => of({}) }
        }
      ]
    })
      .overrideComponent(ConfigureMediaComponent, { set: { template: '', imports: [] } })
      .compileComponents();
  }

  function create(configData?: any) {
    return configure(configData).then(() => {
      fixture = TestBed.createComponent(ConfigureMediaComponent);
      component = fixture.componentInstance;
      dialogService = TestBed.inject(DialogService) as any;
      confirmationService = TestBed.inject(ConfirmationService);
      fixture.detectChanges();
    });
  }

  // ---- Existing smoke test (DO NOT WEAKEN) -------------------------------------------

  describe('construction', () => {
    beforeEach(async () => { await create(); });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('builds updateMediaForm without lastAirDate for a MOVIE', () => {
      expect(component.updateMediaForm.contains('lastAirDate')).toBeFalse();
    });
  });

  // ---- Parent container: loadMedia / loading flag / closeDialog ----------------------
  // Locks analyst brief sec 1 (loadingMedia) + sec 9 + BUG-152 settlement: the loading
  // flag IS reset on BOTH success and error because reset lives in `.add()`. We LOCK that.

  describe('parent container', () => {
    it('loadMedia sets media + resets loadingMedia via .add() on SUCCESS', async () => {
      await create();
      // ngOnInit already ran loadMedia once via detectChanges; assert resulting state.
      expect(mediaService.findOne).toHaveBeenCalledWith(
        MEDIA_ID, { includeHiddenEps: true, includeUnprocessedEps: true });
      expect(component.media).toBeTruthy();
      expect(component.media!._id).toBe(MEDIA_ID);
      expect(component.loadingMedia).toBeFalse();
    });

    it('loadMedia resets loadingMedia even when the request ERRORS (BUG-152 is a false alarm; .add() fires on error)', async () => {
      await create();
      // The current code subscribes with only a `next` handler, so an errored stream's error is
      // reported as an RxJS "unhandled error" (async, absorbed by the suite-level guard above).
      // The teardown — the `.add()` callback that resets the flag — still runs synchronously.
      // Locks CURRENT behavior, settling the BUG-152 contradiction: the reset DOES happen.
      mediaService.findOne.and.returnValue(throwError(() => new Error('boom')));
      component.loadMedia(true);
      expect(component.loadingMedia).toBeFalse();
    });

    it('loadMedia(false) does not toggle loadingMedia', async () => {
      await create();
      const subject = new Subject<any>();
      mediaService.findOne.and.returnValue(subject.asObservable());
      component.loadingMedia = false;
      component.loadMedia(false);
      expect(component.loadingMedia).toBeFalse();
      subject.next(makeMovieMedia());
      subject.complete();
      expect(component.loadingMedia).toBeFalse();
    });

    it('loadMedia sets media for a TV media (episodes now flow down to the Episodes child)', async () => {
      await create({ _id: MEDIA_ID, type: MediaType.TV, title: MEDIA_TITLE });
      mediaService.findOne.and.returnValue(of({
        ...makeMovieMedia({ type: MediaType.TV }),
        tv: { episodes: [{ _id: 'ep1' }], lastAirDate: { day: 1, month: 1, year: 2021 } }
      }));
      component.loadMedia();
      expect(component.media!.type).toBe(MediaType.TV);
      expect(component.media!.tv.episodes).toEqual([{ _id: 'ep1' }] as any);
    });

    it('closeDialog propagates the isUpdated flag through dialogRef.close', async () => {
      await create();
      const ref = TestBed.inject(DynamicDialogRef) as any;
      component.isUpdated = true;
      component.closeDialog();
      expect(ref.close).toHaveBeenCalledWith(true);
    });
  });

  // Images concern moved to ConfigureMediaImagesComponent; coverage lives in its own spec.

  // ---- Form concern: onUpdateMediaFormSubmit DTO shape (cross-boundary contract) ------

  describe('form submit DTO', () => {
    beforeEach(async () => {
      await create();
      component.media = makeMovieMedia();
    });

    it('onUpdateMediaFormSubmit builds the UpdateMediaDto with id-mapped genres and converted runtime, then sets isUpdated', () => {
      component.updateMediaForm.patchValue({
        title: 'T', overview: 'overview at least ten chars',
        genres: [{ _id: 'g1' } as any, { _id: 'g2' } as any],
        producers: [{ _id: 'p1' } as any],
        studios: [{ _id: 's1' } as any],
        tags: [{ _id: 't1' } as any],
        runtime: '01:00:00',
        adult: false, visibility: 1, status: MediaStatus.RELEASED,
        releaseDate: { day: 1, month: 1, year: 2020 } as any
      });
      mediaService.update.and.returnValue(of(makeMovieMedia()));
      component.onUpdateMediaFormSubmit();
      expect(mediaService.update).toHaveBeenCalledTimes(1);
      const [id, dto] = mediaService.update.calls.mostRecent().args;
      expect(id).toBe(MEDIA_ID);
      expect(dto.genres).toEqual(['g1', 'g2']);
      expect(dto.producers).toEqual(['p1']);
      expect(dto.studios).toEqual(['s1']);
      expect(dto.tags).toEqual(['t1']);
      expect(dto.runtime).toBe(3600); // 01:00:00 -> seconds
      expect(component.isUpdated).toBeTrue();
    });

    it('onUpdateMediaFormSubmit is a no-op when the form is invalid', () => {
      component.updateMediaForm.controls.title.setValue('');
      component.updateMediaForm.controls.title.setErrors({ required: true });
      component.onUpdateMediaFormSubmit();
      expect(mediaService.update).not.toHaveBeenCalled();
    });
  });

  // ---- Socket reducers (parent) ------------------------------------------------------

  describe('socket reducers', () => {
    beforeEach(async () => {
      await create();
      component.media = makeMovieMedia();
    });

    it('updateMovieSourceStatus replaces media.movie.status immutably', () => {
      const prev = component.media;
      component.updateMovieSourceStatus(MediaSourceStatus.PENDING);
      expect(component.media!.movie.status).toBe(MediaSourceStatus.PENDING);
      expect(component.media).not.toBe(prev);
    });

    it('updateMediaVideos replaces the videos array immutably', () => {
      const prev = component.media;
      const videos = [{ _id: 'v1' } as any];
      component.updateMediaVideos(videos);
      expect(component.media!.videos).toBe(videos);
      expect(component.media).not.toBe(prev);
    });

    it('updateMediaSubtitles replaces media.movie.subtitles immutably', () => {
      const prev = component.media;
      const subs = [{ _id: 's1' } as any];
      component.updateMediaSubtitles(subs);
      expect(component.media!.movie.subtitles).toBe(subs);
      expect(component.media).not.toBe(prev);
    });

    it('socket reducers no-op when media is undefined', () => {
      component.media = undefined;
      expect(() => component.updateMovieSourceStatus(MediaSourceStatus.DONE)).not.toThrow();
      expect(() => component.updateMediaVideos([])).not.toThrow();
      expect(() => component.updateMediaSubtitles([])).not.toThrow();
      expect(component.media).toBeUndefined();
    });
  });

  // ---- Smoke cover for the other 5 concerns (no-throw seam protection) ----------------
  // These ensure the eventual child splits don't silently break the parent surface.

  describe('other concerns smoke', () => {
    beforeEach(async () => {
      await create();
      component.media = makeMovieMedia();
    });

    // Videos concern moved to ConfigureMediaVideosComponent; coverage lives in its own spec.

    // Source concern (uploadSource / deleteSource / showSourcePreview / checkUploadInQueue) moved
    // to ConfigureMediaSourceComponent; coverage lives in its own spec.

    it('updateExtStreams calls update with extStreams and signals the event', () => {
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');
      mediaService.update.and.returnValue(of(makeMovieMedia()));
      component.updateExtStreams({ streams: [{ x: 1 }] as any, next, error } as any);
      expect(mediaService.update).toHaveBeenCalledWith(MEDIA_ID, { extStreams: [{ x: 1 }] } as any);
      expect(next).toHaveBeenCalled();
    });

    // Episodes concern (showAddSubtitleDialog / showAddSourceDialog / createEpisodeMenuItem +
    // create/configure/delete episode + toggleEpisodeMenu) moved to ConfigureMediaEpisodesComponent;
    // coverage lives in its own spec.
  });

  // ---- Episodes concern (Phase 7.3 extraction #5) ------------------------------------
  // Extracted to ConfigureMediaEpisodesComponent; the episodes characterization net (loadEpisodes,
  // create/configure/delete episode, showAddSubtitle/showAddSource, createEpisodeMenuItem,
  // toggleEpisodeMenu, the MOVIE no-op guard) re-homed to its own spec — assertions unchanged.

});
