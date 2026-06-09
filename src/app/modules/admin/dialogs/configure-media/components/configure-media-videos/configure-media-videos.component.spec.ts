import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { of, throwError, Subject, config as rxConfig } from 'rxjs';

import { ConfigureMediaVideosComponent } from './configure-media-videos.component';
import { ConfirmActionService, MediaService } from '../../../../../../core/services';
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
  let dialogService: any;
  let confirmationService: ConfirmationService;

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

  function create(media: any = makeMovieMedia()) {
    mediaService = {
      findAllVideos: jasmine.createSpy('findAllVideos').and.returnValue(of([makeVideo('v9')])),
      deleteVideo: jasmine.createSpy('deleteVideo').and.returnValue(of(undefined))
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaVideosComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
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
    expect(opts.styleClass).toBe('p-dialog-header-sm');
    expect(opts.contentStyle).toEqual({ 'margin-top': '-1.5rem' });
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
    expect(opts.styleClass).toBe('p-dialog-header-sm');
    expect(opts.contentStyle).toEqual({ 'margin-top': '-1.5rem' });
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
});
