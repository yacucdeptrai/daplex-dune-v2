import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, throwError, config as rxConfig } from 'rxjs';

import { ConfigureMediaSourceComponent } from './configure-media-source.component';
import { ConfirmActionService, MediaService, QueueUploadService } from '../../../../../../core/services';
import { MediaPStatus, MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaSourceComponent (movie source upload +
 * preview tab). Mirror the parent/Images stub pattern: behavior is driven through methods + service
 * spies, not rendered DOM. Beyond the moved behavior, these prove the NG0201-relevant DI — the child
 * injects the route-scoped ConfirmActionService / QueueUploadService from the surrounding injector
 * tree (never re-provided in the child's own `providers`), exactly as it would inside the dialog.
 *
 * These assert WHAT THE CODE DOES TODAY (pre-split parent behavior, re-homed to the child), not what
 * is ideal: the source tab is MOVIE-only; `checkUploadInQueue` runs on the child's own init (the
 * parent ngOnInit call is dropped — behavior-preserving per the lazy-tab model); the optimistic
 * status->PENDING change bubbles up immutably via `mediaChange` while the authoritative socket
 * reducer (`updateMovieSourceStatus`) stays in the parent. `parentDialogRef` is accepted for
 * template parity only and is unused (the source tab opens no nested dialog).
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

/** Minimal MOVIE-shaped MediaDetails sufficient for the source handlers under test. */
function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE,
    status: MediaStatus.RELEASED, pStatus: MediaPStatus.DONE,
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    ...overrides
  };
}

describe('ConfigureMediaSourceComponent', () => {
  let component: ConfigureMediaSourceComponent;
  let fixture: ComponentFixture<ConfigureMediaSourceComponent>;
  let mediaService: any;
  let queueUploadService: any;
  let confirmationService: ConfirmationService;

  // `deleteSource` subscribes with a next-only handler, so an errored stream reports an *async*
  // RxJS "unhandled error" on a later macrotask — after the triggering spec's afterEach. The
  // suite-level guard absorbs that deferred report so it cannot disconnect Karma; the synchronous
  // assertions still run against real behavior. Restored in afterAll. Mirrors the Videos spec.
  let originalOnUnhandledError: ((err: any) => void) | undefined;
  beforeAll(() => {
    originalOnUnhandledError = rxConfig.onUnhandledError ?? undefined;
    rxConfig.onUnhandledError = () => { /* expected async report from next-only subscribe */ };
  });
  afterAll(() => {
    rxConfig.onUnhandledError = originalOnUnhandledError ?? null;
  });

  function create(media: any = makeMovieMedia(), inQueue: boolean = false) {
    mediaService = {
      findMovieStreams: jasmine.createSpy('findMovieStreams').and.returnValue(of({ id: 'stream' })),
      deleteMovieSource: jasmine.createSpy('deleteMovieSource').and.returnValue(of(undefined))
    };
    queueUploadService = {
      isMediaInQueue: jasmine.createSpy('isMediaInQueue').and.returnValue(inQueue),
      addToQueue: jasmine.createSpy('addToQueue')
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaSourceComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: QueueUploadService, useValue: queueUploadService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ConfigureMediaSourceComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaSourceComponent);
        component = fixture.componentInstance;
        confirmationService = TestBed.inject(ConfirmationService);
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  // 1. create / DI ---------------------------------------------------------------------

  it('should create (injects route-scoped ConfirmActionService/QueueUploadService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('on init checkUploadInQueue sets isUploadingSource from queueUploadService.isMediaInQueue(media._id)', async () => {
    await create(makeMovieMedia(), /* inQueue */ true);
    expect(queueUploadService.isMediaInQueue).toHaveBeenCalledWith(MEDIA_ID);
    expect(component.isUploadingSource).toBeTrue();
  });

  // 2. checkUploadInQueue --------------------------------------------------------------

  it('checkUploadInQueue sets isUploadingSource true when the media is in the upload queue', async () => {
    await create();
    queueUploadService.isMediaInQueue.and.returnValue(true);
    component.checkUploadInQueue();
    expect(queueUploadService.isMediaInQueue).toHaveBeenCalledWith(MEDIA_ID);
    expect(component.isUploadingSource).toBeTrue();
  });

  it('checkUploadInQueue sets isUploadingSource false when the media is not in the upload queue', async () => {
    await create();
    queueUploadService.isMediaInQueue.and.returnValue(false);
    component.isUploadingSource = true;
    component.checkUploadInQueue();
    expect(queueUploadService.isMediaInQueue).toHaveBeenCalledWith(MEDIA_ID);
    expect(component.isUploadingSource).toBeFalse();
  });

  // 3. uploadSource --------------------------------------------------------------------

  it('uploadSource enqueues via QueueUploadService with the movie source URLs and flips isUploadingSource', async () => {
    await create();
    const file = new File([''], 'src.mp4');
    component.uploadSource(file);
    expect(queueUploadService.addToQueue).toHaveBeenCalledWith(
      MEDIA_ID, file, `media/${MEDIA_ID}/movie/source`, `media/${MEDIA_ID}/movie/source/:id`);
    expect(component.isUploadingSource).toBeTrue();
  });

  // 4. showSourcePreview ---------------------------------------------------------------

  it('showSourcePreview shows the player and loads the preview stream', async () => {
    await create();
    mediaService.findMovieStreams.and.returnValue(of({ id: 'preview-stream' }));
    component.showSourcePreview();
    expect(component.showMoviePlayer).toBeTrue();
    expect(mediaService.findMovieStreams).toHaveBeenCalledWith(MEDIA_ID, { preview: true });
    expect(component.previewStream).toEqual({ id: 'preview-stream' } as any);
  });

  // 5. deleteSource --------------------------------------------------------------------

  it('deleteSource confirms with key:"inModal" and the delete-source header', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    component.deleteSource({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deleteSourceConfirmationHeader');
    expect(typeof arg.accept).toBe('function');
  });

  it('deleteSource accept deletes the source, emits status->PENDING media immutably, re-checks queue, emits updated', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    const prev = component.media();
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));
    component.deleteSource({ target: document.createElement('button') } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(mediaService.deleteMovieSource).toHaveBeenCalledWith(MEDIA_ID);
    // optimistic, immutable bubble-up: { ...media, movie: { ...movie, status: PENDING }, pStatus: PENDING }
    expect(merged).not.toBe(prev);
    expect(merged.movie).not.toBe(prev.movie);
    expect(merged.movie.status).toBe(MediaSourceStatus.PENDING);
    expect(merged.pStatus).toBe(MediaPStatus.PENDING);
    // input media is not mutated in place by the optimistic update
    expect(prev.movie.status).toBe(MediaSourceStatus.DONE);
    expect(queueUploadService.isMediaInQueue).toHaveBeenCalledWith(MEDIA_ID);
    expect(updated).toBeTrue();
  });

  it('deleteSource toggles the trigger button disabled true then false on SUCCESS (via renderer.setProperty)', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deleteSource({ target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });

  it('deleteSource error path re-enables the trigger button via the .add() finally', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    mediaService.deleteMovieSource.and.returnValue(throwError(() => new Error('nope')));
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deleteSource({ target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });
});
