import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, throwError, Subject, config as rxConfig } from 'rxjs';
import { delay } from 'rxjs/operators';

import { ConfigureMediaVideosComponent } from './configure-media-videos.component';
import { ConfirmActionService, MediaScannerService, MediaService } from '../../../../../../core/services';
import { MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaVideosComponent (movie trailer/videos tab).
 * Mirror the parent/Subtitles stub pattern: behavior is driven through methods + service spies, not
 * rendered DOM. Beyond the moved behavior, these prove the NG0201-relevant DI — the child injects the
 * route-scoped ConfirmActionService / DialogService from the surrounding injector tree (never
 * re-provided in the child's own `providers`), exactly as it would inside the dialog.
 *
 * These assert WHAT THE CODE DOES TODAY (pre-split parent behavior, re-homed to the child), not what
 * is ideal: e.g. `loadVideos` is carried for parity even though it has no caller, and the trailer
 * dialog/index state lives here while the socket reducer (`updateMediaVideos`) stays in the parent.
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

function makeVideo(id: string): any {
  return { _id: id, name: `v-${id}`, key: `key-${id}`, site: 'YouTube' };
}

function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE,
    status: MediaStatus.RELEASED,
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    videos: [makeVideo('v1'), makeVideo('v2')],
    ...overrides
  };
}

describe('ConfigureMediaVideosComponent', () => {
  let component: ConfigureMediaVideosComponent;
  let fixture: ComponentFixture<ConfigureMediaVideosComponent>;
  let mediaService: any;
  let scannerService: any;
  let dialogService: any;
  let confirmationService: ConfirmationService;
  let messageService: MessageService;

  // `loadVideos` subscribes with a next-only handler, so an errored stream reports an *async*
  // RxJS "unhandled error" on a later macrotask — after the triggering spec's afterEach. The
  // suite-level guard absorbs that deferred report so it cannot disconnect Karma; the synchronous
  // assertions still run against real behavior. Restored in afterAll. Mirrors the parent spec.
  let originalOnUnhandledError: ((err: any) => void) | undefined;
  beforeAll(() => {
    originalOnUnhandledError = rxConfig.onUnhandledError ?? undefined;
    rxConfig.onUnhandledError = () => { /* expected async report from next-only subscribe */ };
  });
  afterAll(() => {
    rxConfig.onUnhandledError = originalOnUnhandledError ?? null;
  });

  function makeScannerVideo(key: string, official = false): any {
    return { name: `sv-${key}`, key, type: official ? 'Trailer' : 'Teaser', official };
  }

  function create(media: any = makeMovieMedia()) {
    mediaService = {
      findAllVideos: jasmine.createSpy('findAllVideos').and.returnValue(of([makeVideo('v9')])),
      deleteVideo: jasmine.createSpy('deleteVideo').and.returnValue(of(undefined)),
      importVideoFromScan: jasmine.createSpy('importVideoFromScan').and.callFake(
        (_id: string, v: any) => of([makeVideo('v1'), makeVideo('v2'), makeVideo(v.key)]))
    };
    scannerService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of({ videos: [makeScannerVideo('new1', true)] }))
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaVideosComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        MessageService,
        { provide: MediaService, useValue: mediaService },
        { provide: MediaScannerService, useValue: scannerService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ConfigureMediaVideosComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaVideosComponent);
        component = fixture.componentInstance;
        dialogService = TestBed.inject(DialogService) as any;
        confirmationService = TestBed.inject(ConfirmationService);
        messageService = TestBed.inject(MessageService);
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  // 1. create / DI ---------------------------------------------------------------------

  it('should create (injects route-scoped ConfirmActionService/DialogService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  // 2. viewVideo -----------------------------------------------------------------------

  it('viewVideo sets activeVideoIndex and shows the player when not loading', async () => {
    await create();
    component.loadingVideo = false;
    component.viewVideo(3);
    expect(component.activeVideoIndex).toBe(3);
    expect(component.displayVideo).toBeTrue();
  });

  it('viewVideo is a no-op while loadingVideo is true (guard)', async () => {
    await create();
    component.loadingVideo = true;
    component.activeVideoIndex = 0;
    component.displayVideo = false;
    component.viewVideo(5);
    expect(component.activeVideoIndex).toBe(0);
    expect(component.displayVideo).toBeFalse();
  });

  // 3. showAddVideoDialog --------------------------------------------------------------

  it('showAddVideoDialog opens AddVideoComponent with data:{...media} and the exact dialog opts', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(undefined) };
    dialogService.open.and.returnValue(closeRef);
    component.showAddVideoDialog();
    expect(dialogService.open).toHaveBeenCalled();
    const [, opts] = dialogService.open.calls.mostRecent().args;
    expect(opts.data._id).toBe(MEDIA_ID);
    expect(opts.width).toBe('700px');
    expect(opts.modal).toBeTrue();
    expect(opts.dismissableMask).toBeFalse();
    expect(opts.styleClass).toContain('app-form-dialog');
  });

  it('showAddVideoDialog emits {...media, videos:[...videos]} on onClose(MediaVideo[])', async () => {
    await create();
    const newVideos = [makeVideo('a'), makeVideo('b'), makeVideo('c')];
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(newVideos) };
    dialogService.open.and.returnValue(closeRef);
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.showAddVideoDialog();
    expect(merged._id).toBe(MEDIA_ID);
    expect(merged.videos).toEqual(newVideos);
    expect(merged.videos).not.toBe(newVideos); // immutable copy: [...videos]
  });

  it('showAddVideoDialog onClose no-ops when the dialog returns undefined', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(undefined) };
    dialogService.open.and.returnValue(closeRef);
    let emitted = false;
    component.mediaChange.subscribe(() => (emitted = true));
    component.showAddVideoDialog();
    expect(emitted).toBeFalse();
  });

  // 4. showUpdateVideoDialog -----------------------------------------------------------

  it('showUpdateVideoDialog opens UpdateVideoComponent with data:{media:{...media}, video:{...video}}', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(undefined) };
    dialogService.open.and.returnValue(closeRef);
    const video = makeVideo('v1');
    component.showUpdateVideoDialog(video);
    expect(dialogService.open).toHaveBeenCalled();
    const [, opts] = dialogService.open.calls.mostRecent().args;
    expect(opts.data.media._id).toBe(MEDIA_ID);
    expect(opts.data.video._id).toBe('v1');
    expect(opts.width).toBe('700px');
    expect(opts.styleClass).toContain('app-form-dialog');
  });

  it('showUpdateVideoDialog emits {...media, videos} on onClose(MediaVideo[])', async () => {
    await create();
    const updated = [makeVideo('v1'), makeVideo('v2x')];
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(updated) };
    dialogService.open.and.returnValue(closeRef);
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.showUpdateVideoDialog(makeVideo('v1'));
    expect(merged._id).toBe(MEDIA_ID);
    expect(merged.videos).toBe(updated); // update path emits videos by reference: {...media, videos}
  });

  it('showUpdateVideoDialog onClose no-ops when the dialog returns undefined', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(undefined) };
    dialogService.open.and.returnValue(closeRef);
    let emitted = false;
    component.mediaChange.subscribe(() => (emitted = true));
    component.showUpdateVideoDialog(makeVideo('v1'));
    expect(emitted).toBeFalse();
  });

  // 5. deleteVideo ---------------------------------------------------------------------

  it('deleteVideo confirms with key:"inModal" and the delete-video header', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    component.deleteVideo(makeVideo('v1'), { target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deleteVideoConfirmationHeader');
    expect(typeof arg.accept).toBe('function');
  });

  it('deleteVideo accept deletes via service and emits the filtered videos', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.deleteVideo(makeVideo('v1'), { target: document.createElement('button') } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(mediaService.deleteVideo).toHaveBeenCalledWith(MEDIA_ID, 'v1');
    expect(merged.videos.map((v: any) => v._id)).toEqual(['v2']);
  });

  it('deleteVideo error path re-enables the trigger element', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    mediaService.deleteVideo.and.returnValue(throwError(() => new Error('nope')));
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deleteVideo(makeVideo('v1'), { target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });

  // 6. loadVideos (carried for parity) -------------------------------------------------

  it('loadVideos toggles loadingVideo, emits {...media, videos}, and resets the flag on SUCCESS', async () => {
    await create();
    const loaded = [makeVideo('x1'), makeVideo('x2')];
    mediaService.findAllVideos.and.returnValue(of(loaded));
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));
    component.loadVideos();
    expect(mediaService.findAllVideos).toHaveBeenCalledWith(MEDIA_ID);
    expect(merged._id).toBe(MEDIA_ID);
    expect(merged.videos).toBe(loaded);
    expect(component.loadingVideo).toBeFalse();
  });

  it('loadVideos sets loadingVideo true while the request is in flight', async () => {
    await create();
    const subject = new Subject<any>();
    mediaService.findAllVideos.and.returnValue(subject.asObservable());
    component.loadVideos();
    expect(component.loadingVideo).toBeTrue();
    subject.next([makeVideo('x1')]);
    subject.complete();
    expect(component.loadingVideo).toBeFalse();
  });

  it('loadVideos resets loadingVideo even when the request ERRORS (reset lives in .add())', async () => {
    await create();
    mediaService.findAllVideos.and.returnValue(throwError(() => new Error('boom')));
    component.loadVideos();
    expect(component.loadingVideo).toBeFalse();
  });

  // 7. blockScroll ---------------------------------------------------------------------

  it('blockScroll adds p-overflow-hidden to document.body', async () => {
    await create();
    document.body.classList.remove('p-overflow-hidden');
    component.blockScroll();
    expect(document.body.classList.contains('p-overflow-hidden')).toBeTrue();
    document.body.classList.remove('p-overflow-hidden'); // leave the DOM clean for other specs
  });

  // 8. importFromProvider --------------------------------------------------------------

  it('canImportVideos is false without a tmdb/tvdb id (null-seeded externalIds)', async () => {
    await create(makeMovieMedia({ externalIds: { imdb: '', tmdb: null, tvdb: null, aniList: null, mal: null } }));
    expect(component.canImportVideos).toBeFalse();
  });

  it('canImportVideos is true when a tmdb id is present', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    expect(component.canImportVideos).toBeTrue();
  });

  it('importFromProvider no-ops when no external id is set', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: null, tvdb: null } }));
    component.importFromProvider();
    expect(scannerService.findOne).not.toHaveBeenCalled();
  });

  it('importFromProvider fetches tmdb videos, opens the chooser, imports the selection SEQUENTIALLY and merges videos', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    const selection = [makeScannerVideo('s1', true), makeScannerVideo('s2', false)];
    scannerService.findOne.and.returnValue(of({ videos: selection }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(selection) });
    let merged: any;
    component.mediaChange.subscribe(m => (merged = m));

    component.importFromProvider();

    const [id, dto] = scannerService.findOne.calls.mostRecent().args;
    expect(id).toBe(603);
    expect(dto.provider).toBe('tmdb');
    expect(dto.type).toBe(MediaType.MOVIE);
    const cfg = dialogService.open.calls.mostRecent().args[1];
    expect(cfg.data.items.length).toBe(2);
    // Sequential: one importVideoFromScan call per selected item, with `official` preserved.
    expect(mediaService.importVideoFromScan).toHaveBeenCalledTimes(2);
    const firstCall = mediaService.importVideoFromScan.calls.argsFor(0);
    expect(firstCall[1]).toEqual({ key: 's1', name: 'sv-s1', official: true });
    expect(merged.videos).toBeDefined();
    expect(component.isImportingVideos).toBeFalse();
  });

  // The BE addMediaVideo does findOne->push->save per request; concurrent POSTs lose updates. The
  // imports must run sequentially (concat), so the 2nd POST is not issued until the 1st settles.
  it('imports SEQUENTIALLY — the 2nd POST waits for the 1st to complete (NOT forkJoin)', fakeAsync(async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    const selection = [makeScannerVideo('s1', true), makeScannerVideo('s2', false)];
    scannerService.findOne.and.returnValue(of({ videos: selection }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(selection) });
    // Each POST resolves after 10ms.
    mediaService.importVideoFromScan.and.callFake(() => of([makeVideo('vx')]).pipe(delay(10)));

    component.importFromProvider();
    // First POST issued, second not yet (waiting for the first).
    expect(mediaService.importVideoFromScan).toHaveBeenCalledTimes(1);
    tick(10);
    // First settled -> second now issued.
    expect(mediaService.importVideoFromScan).toHaveBeenCalledTimes(2);
    tick(10);
    expect(component.isImportingVideos).toBeFalse();
  }));

  it('importFromProvider dedups already-present keys before opening the chooser', async () => {
    // media has video keyed 'key-v1'; the provider returns that key + a new one.
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    scannerService.findOne.and.returnValue(of({ videos: [makeScannerVideo('key-v1', true), makeScannerVideo('fresh', false)] }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(null) });
    component.importFromProvider();
    const cfg = dialogService.open.calls.mostRecent().args[1];
    expect(cfg.data.items.map((v: any) => v.key)).toEqual(['fresh']);
  });

  it('importFromProvider shows an info toast and opens no chooser when all keys are already present', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    scannerService.findOne.and.returnValue(of({ videos: [makeScannerVideo('key-v1', true), makeScannerVideo('key-v2', false)] }));
    const addToast = spyOn(messageService, 'add');
    component.importFromProvider();
    expect(dialogService.open).not.toHaveBeenCalled();
    expect(addToast.calls.mostRecent().args[0].detail).toBe('admin.videoChooser.noImportableVideos');
    expect(component.isImportingVideos).toBeFalse();
  });

  it('importFromProvider shows an info toast and opens no chooser when the provider has no videos', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    scannerService.findOne.and.returnValue(of({ videos: [] }));
    const addToast = spyOn(messageService, 'add');
    component.importFromProvider();
    expect(dialogService.open).not.toHaveBeenCalled();
    expect(addToast.calls.mostRecent().args[0].detail).toBe('admin.videoChooser.noProviderVideos');
    expect(component.isImportingVideos).toBeFalse();
  });

  it('clears the flag when the chooser is dismissed without a selection', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    scannerService.findOne.and.returnValue(of({ videos: [makeScannerVideo('s1', true)] }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(null) });
    component.importFromProvider();
    expect(mediaService.importVideoFromScan).not.toHaveBeenCalled();
    expect(component.isImportingVideos).toBeFalse();
  });

  // The 2a lesson: the flag must span fetch -> async chooser-close -> sequential import as one phase.
  // Uses a deferred onClose (Subject) + delayed imports so the multi-phase lifecycle is exercised (a
  // synchronous `of(...)` onClose would let the bug through).
  it('keeps isImportingVideos true across the async chooser-close and the imports, clearing only when they settle', fakeAsync(async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    const selection = [makeScannerVideo('s1', true)];
    scannerService.findOne.and.returnValue(of({ videos: selection }));
    const onClose$ = new Subject<any>();
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: onClose$.asObservable() });
    mediaService.importVideoFromScan.and.returnValue(of([makeVideo('vx')]).pipe(delay(10)));

    component.importFromProvider();
    // fetch resolved synchronously, chooser open, nothing selected yet -> flag held
    expect(component.isImportingVideos).withContext('held while chooser open').toBeTrue();
    expect(mediaService.importVideoFromScan).not.toHaveBeenCalled();

    onClose$.next(selection);
    onClose$.complete();
    // import in flight -> flag still held
    expect(mediaService.importVideoFromScan).toHaveBeenCalled();
    expect(component.isImportingVideos).withContext('held during import').toBeTrue();

    tick(10);
    // imports settled -> single clear
    expect(component.isImportingVideos).withContext('cleared after import').toBeFalse();
  }));

  // A failed POST: the http-error interceptor owns the toast (mocked out here), so the component must
  // NOT add its own (no double-toast); the empty error handler keeps it off the unhandled-error path;
  // the .add() finalizer still clears the flag. notify() (the only messageService.add caller) fires
  // only on success/no-video, so on error there is zero messageService.add.
  it('on a failed import: clears the flag, adds no toast (no double-toast), no unhandled error', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    const selection = [makeScannerVideo('s1', true)];
    scannerService.findOne.and.returnValue(of({ videos: selection }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(selection) });
    mediaService.importVideoFromScan.and.returnValue(throwError(() => new Error('500')));
    const addToast = spyOn(messageService, 'add');
    let emitted = false;
    component.mediaChange.subscribe(() => (emitted = true));

    component.importFromProvider();

    expect(mediaService.importVideoFromScan).toHaveBeenCalled();
    expect(emitted).withContext('no merge on failure').toBeFalse();
    expect(addToast).withContext('interceptor owns the toast, not the component').not.toHaveBeenCalled();
    expect(component.isImportingVideos).withContext('flag cleared via finalizer').toBeFalse();
  });
});
