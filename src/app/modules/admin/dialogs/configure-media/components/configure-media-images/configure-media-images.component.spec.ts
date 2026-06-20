import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Renderer2 } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Subject, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { ConfigureMediaImagesComponent } from './configure-media-images.component';
import { ConfirmActionService, MediaScannerService, MediaService } from '../../../../../../core/services';
import { MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaImagesComponent. Mirror the parent
 * stub pattern: behavior is driven through methods + service spies, not rendered DOM.
 *
 * Beyond the moved behavior, these prove the NG0201-relevant DI: the child injects the
 * route-scoped ConfirmActionService / DialogService from the surrounding injector tree
 * (never re-provided in the child's own `providers`), exactly as it would inside the dialog.
 */

const PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE,
    status: MediaStatus.RELEASED, movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    posterUrl: 'p', thumbnailPosterUrl: 'tp', smallPosterUrl: 'sp', fullPosterUrl: 'fp',
    posterColor: 1, posterPlaceholder: 'pp',
    backdropUrl: 'b', thumbnailBackdropUrl: 'tb', smallBackdropUrl: 'sb', fullBackdropUrl: 'fb',
    backdropColor: 2, backdropPlaceholder: 'bp',
    ...overrides
  };
}

describe('ConfigureMediaImagesComponent', () => {
  let component: ConfigureMediaImagesComponent;
  let fixture: ComponentFixture<ConfigureMediaImagesComponent>;
  let mediaService: any;
  let scannerService: any;
  let dialogService: any;
  let confirmationService: ConfirmationService;

  function create(media: any = makeMovieMedia()) {
    mediaService = {
      uploadPoster: jasmine.createSpy('uploadPoster').and.returnValue(of({ posterUrl: 'new-poster' })),
      uploadBackdrop: jasmine.createSpy('uploadBackdrop').and.returnValue(of({ backdropUrl: 'new-backdrop' })),
      uploadPosterFromUrl: jasmine.createSpy('uploadPosterFromUrl').and.returnValue(of({ posterUrl: 'from-url-poster' })),
      uploadBackdropFromUrl: jasmine.createSpy('uploadBackdropFromUrl').and.returnValue(of({ backdropUrl: 'from-url-backdrop' })),
      deletePoster: jasmine.createSpy('deletePoster').and.returnValue(of(undefined)),
      deleteBackdrop: jasmine.createSpy('deleteBackdrop').and.returnValue(of(undefined))
    };
    scannerService = {
      findImages: jasmine.createSpy('findImages').and.returnValue(of({
        posters: [{ aspectRatio: 0.667, height: 1500, width: 1000, fileUrl: 'https://image.tmdb.org/p.jpg' }],
        backdrops: [{ aspectRatio: NaN, height: 720, width: 1280, fileUrl: 'https://artworks.thetvdb.com/b.jpg' }]
      }))
    };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaImagesComponent],
      providers: [
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector, never by the child itself.
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: MediaScannerService, useValue: scannerService },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ConfigureMediaImagesComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaImagesComponent);
        component = fixture.componentInstance;
        dialogService = TestBed.inject(DialogService) as any;
        confirmationService = TestBed.inject(ConfirmationService);
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges();
      });
  }

  it('should create (injects route-scoped ConfirmActionService/DialogService without NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('editImage opens a dialog via dialogService and returns its onClose stream', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(['data:uri', 'name.png']) };
    dialogService.open.and.returnValue(closeRef);
    const cfg: any = { aspectRatioWidth: 2, aspectRatioHeight: 3, minWidth: 1, minHeight: 1, imageFile: new File([], 'a'), maxSize: 1 };
    let emitted: any;
    component.editImage(cfg).subscribe(v => (emitted = v));
    expect(dialogService.open).toHaveBeenCalled();
    expect(emitted).toEqual(['data:uri', 'name.png']);
  });

  it('onInputPosterChange sets posterPreviewName/Uri from the image editor result', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(['preview-uri', 'poster.png']) };
    dialogService.open.and.returnValue(closeRef);
    const event = { target: { files: [new File(['x'], 'poster.png')] } } as unknown as Event;
    component.onInputPosterChange(event);
    expect(component.posterPreviewName).toBe('poster.png');
    expect(component.posterPreviewUri).toBe('preview-uri');
  });

  it('onInputPosterChange throws when the chosen file exceeds IMAGE_PREVIEW_SIZE', async () => {
    await create();
    const big = new File([''], 'p.png');
    Object.defineProperty(big, 'size', { value: 8388608 + 1 });
    const event = { target: { files: [big] } } as unknown as Event;
    expect(() => component.onInputPosterChange(event)).toThrowError(/uploadPosterTooLarge/);
  });

  it('onInputBackdropChange sets backdropPreviewName/Uri from the image editor result', async () => {
    await create();
    const closeRef = { ...mockDynamicDialogRef(), onClose: of(['bd-uri', 'bd.png']) };
    dialogService.open.and.returnValue(closeRef);
    const event = { target: { files: [new File(['x'], 'bd.png')] } } as unknown as Event;
    component.onInputBackdropChange(event);
    expect(component.backdropPreviewName).toBe('bd.png');
    expect(component.backdropPreviewUri).toBe('bd-uri');
  });

  it('onUpdatePosterSubmit uploads, emits merged media + updated, clears preview', async () => {
    await create();
    component.posterPreviewName = 'poster.png';
    component.posterPreviewUri = PNG_DATA_URI;
    mediaService.uploadPoster.and.returnValue(of({ posterUrl: 'merged-poster' }));
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));
    component.onUpdatePosterSubmit();
    const posterArgs = mediaService.uploadPoster.calls.mostRecent().args;
    expect(posterArgs[0]).toBe(MEDIA_ID);
    expect(posterArgs[1] instanceof Blob).toBeTrue();
    expect(posterArgs[2]).toBe('poster.png');
    expect(merged.posterUrl).toBe('merged-poster');
    expect(updated).toBeTrue();
    expect(component.posterPreviewName).toBeUndefined();
    expect(component.posterPreviewUri).toBeUndefined();
    expect(component.isUpdatingPoster).toBeFalse();
  });

  it('onUpdatePosterSubmit is a no-op when there is no posterPreviewName', async () => {
    await create();
    component.posterPreviewName = undefined;
    component.onUpdatePosterSubmit();
    expect(mediaService.uploadPoster).not.toHaveBeenCalled();
  });

  it('onUpdateBackdropSubmit emits merged media but does NOT emit updated', async () => {
    await create();
    component.backdropPreviewName = 'bd.png';
    component.backdropPreviewUri = PNG_DATA_URI;
    mediaService.uploadBackdrop.and.returnValue(of({ backdropUrl: 'merged-bd' }));
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));
    component.onUpdateBackdropSubmit();
    expect(mediaService.uploadBackdrop).toHaveBeenCalledTimes(1);
    expect(merged.backdropUrl).toBe('merged-bd');
    expect(updated).toBeFalse();
    expect(component.backdropPreviewName).toBeUndefined();
    expect(component.isUpdatingBackdrop).toBeFalse();
  });

  it('onUpdatePosterCancel clears poster preview state', async () => {
    await create();
    component.posterPreviewName = 'x'; component.posterPreviewUri = 'y';
    component.onUpdatePosterCancel();
    expect(component.posterPreviewName).toBeUndefined();
    expect(component.posterPreviewUri).toBeUndefined();
  });

  it('onUpdateBackdropCancel clears backdrop preview state', async () => {
    await create();
    component.backdropPreviewName = 'x'; component.backdropPreviewUri = 'y';
    component.onUpdateBackdropCancel();
    expect(component.backdropPreviewName).toBeUndefined();
    expect(component.backdropPreviewUri).toBeUndefined();
  });

  it('deletePoster requests confirmDelete with key:"inModal" and the delete-poster header', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    component.deletePoster({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deletePosterConfirmationHeader');
    expect(typeof arg.accept).toBe('function');
  });

  it('deletePoster accept emits poster-cleared media + updated', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));
    component.deletePoster({ target: document.createElement('button') } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(mediaService.deletePoster).toHaveBeenCalledWith(MEDIA_ID);
    expect(merged.posterUrl).toBeUndefined();
    expect(merged.thumbnailPosterUrl).toBeUndefined();
    expect(merged.smallPosterUrl).toBeUndefined();
    expect(merged.fullPosterUrl).toBeUndefined();
    expect(merged.posterColor).toBeUndefined();
    expect(merged.posterPlaceholder).toBeUndefined();
    expect(updated).toBeTrue();
  });

  it('deleteBackdrop accept emits backdrop-cleared media (no updated)', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));
    component.deleteBackdrop({ target: document.createElement('button') } as unknown as Event);
    const arg = confirmSpy.calls.mostRecent().args[0];
    expect(arg.key).toBe('inModal');
    expect(arg.header).toBe('admin.media.deleteBackdropConfirmationHeader');
    arg.accept!();
    expect(mediaService.deleteBackdrop).toHaveBeenCalledWith(MEDIA_ID);
    expect(merged.backdropUrl).toBeUndefined();
    expect(merged.thumbnailBackdropUrl).toBeUndefined();
    expect(merged.smallBackdropUrl).toBeUndefined();
    expect(merged.fullBackdropUrl).toBeUndefined();
    expect(merged.backdropColor).toBeUndefined();
    expect(merged.backdropPlaceholder).toBeUndefined();
    expect(updated).toBeFalse();
  });

  it('deletePoster error path re-enables the trigger element', async () => {
    await create();
    const confirmSpy = spyOn(confirmationService, 'confirm');
    mediaService.deletePoster.and.returnValue(throwError(() => new Error('nope')));
    const button = document.createElement('button');
    const renderer = (component as any).renderer as Renderer2;
    const setProp = spyOn(renderer, 'setProperty').and.callThrough();
    component.deletePoster({ target: button } as unknown as Event);
    confirmSpy.calls.mostRecent().args[0].accept!();
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', true);
    expect(setProp).toHaveBeenCalledWith(button, 'disabled', false);
  });

  // ── Import from provider ──────────────────────────────────────────────────
  it('canImport is false with neither tmdb nor tvdb id (null-seeded externalIds)', async () => {
    await create(makeMovieMedia({ externalIds: { imdb: '', tmdb: null, tvdb: null, aniList: null, mal: null } }));
    expect(component.canImport).toBeFalse();
  });

  it('canImport is true when a tmdb id is present', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    expect(component.canImport).toBeTrue();
  });

  it('canImport is true when only a tvdb id is present (tmdb falsy)', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 0, tvdb: 1234 } }));
    expect(component.canImport).toBeTrue();
  });

  it('onImportPoster no-ops when no external id is set', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: null, tvdb: null } }));
    component.onImportPoster();
    expect(scannerService.findImages).not.toHaveBeenCalled();
  });

  it('onImportPoster fetches tmdb posters, opens the chooser, and on pick uploads + emits merged media + updated', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of('https://image.tmdb.org/p.jpg') });
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));

    component.onImportPoster();

    const [id, dto] = scannerService.findImages.calls.mostRecent().args;
    expect(id).toBe(603);
    expect(dto.provider).toBe('tmdb');
    expect(dto.type).toBe(MediaType.MOVIE);
    expect(dialogService.open).toHaveBeenCalled();
    const cfg = dialogService.open.calls.mostRecent().args[1];
    expect(cfg.data.kind).toBe('poster');
    expect(cfg.data.items.length).toBe(1);
    expect(mediaService.uploadPosterFromUrl).toHaveBeenCalledWith(MEDIA_ID, 'https://image.tmdb.org/p.jpg');
    expect(merged.posterUrl).toBe('from-url-poster');
    expect(updated).toBeTrue();
    expect(component.isImportingPoster).toBeFalse();
  });

  it('onImportPoster does not upload, and clears the loading flag, when the chooser is dismissed without a pick', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of(undefined) });
    component.onImportPoster();
    expect(scannerService.findImages).toHaveBeenCalled();
    expect(mediaService.uploadPosterFromUrl).not.toHaveBeenCalled();
    expect(component.isImportingPoster).toBeFalse();
  });

  // M1: the loading flag must span fetch -> async chooser-close -> upload as one phase. Uses a deferred
  // onClose (Subject) + a delayed upload so the two-phase lifecycle is actually exercised (a synchronous
  // `of(...)` onClose, as the other specs use, would let the bug through).
  it('keeps isImportingPoster true across the async chooser-close and the upload, clearing only when the upload settles', fakeAsync(async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 603, tvdb: null } }));
    const onClose$ = new Subject<string>();
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: onClose$.asObservable() });
    mediaService.uploadPosterFromUrl.and.returnValue(of({ posterUrl: 'from-url-poster' }).pipe(delay(10)));

    component.onImportPoster();
    // fetch resolved synchronously, chooser open, nothing picked yet -> flag held
    expect(component.isImportingPoster).withContext('held while chooser open').toBeTrue();
    expect(mediaService.uploadPosterFromUrl).not.toHaveBeenCalled();

    onClose$.next('https://image.tmdb.org/p.jpg');
    onClose$.complete();
    // upload in flight -> flag still held
    expect(mediaService.uploadPosterFromUrl).toHaveBeenCalledWith(MEDIA_ID, 'https://image.tmdb.org/p.jpg');
    expect(component.isImportingPoster).withContext('held during upload').toBeTrue();

    tick(10);
    // upload settled -> single clear
    expect(component.isImportingPoster).withContext('cleared after upload').toBeFalse();
  }));

  it('onImportBackdrop uploads from the chosen url and emits merged media WITHOUT updated', async () => {
    await create(makeMovieMedia({ externalIds: { tmdb: 0, tvdb: 1234 } }));
    dialogService.open.and.returnValue({ ...mockDynamicDialogRef(), onClose: of('https://artworks.thetvdb.com/b.jpg') });
    let merged: any; let updated = false;
    component.mediaChange.subscribe(m => (merged = m));
    component.updated.subscribe(() => (updated = true));

    component.onImportBackdrop();

    const [id, dto] = scannerService.findImages.calls.mostRecent().args;
    expect(id).toBe(1234);
    expect(dto.provider).toBe('tvdb');
    const cfg = dialogService.open.calls.mostRecent().args[1];
    expect(cfg.data.kind).toBe('backdrop');
    expect(mediaService.uploadBackdropFromUrl).toHaveBeenCalledWith(MEDIA_ID, 'https://artworks.thetvdb.com/b.jpg');
    expect(merged.backdropUrl).toBe('from-url-backdrop');
    expect(updated).toBeFalse();
    expect(component.isImportingBackdrop).toBeFalse();
  });
});
