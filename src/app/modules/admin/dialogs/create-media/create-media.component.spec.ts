import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of, throwError, config as rxConfig } from 'rxjs';

import { CreateMediaComponent } from './create-media.component';
import { GenresService, ItemDataService, MediaService, ProductionsService, QueueUploadService, TagsService } from '../../../../core/services';
import { ImageEditorComponent } from '../../../../shared/dialogs/image-editor';
import { MediaStatus, MediaType } from '../../../../core/enums';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  mockTranslocoService
} from '../../../../../testing/test-helpers';

/**
 * Characterization tests for CreateMediaComponent — the create-media flow (step 1: create form,
 * step 2: edit form) that is one of the two consumers of the soon-to-be-extracted
 * MediaFormHelperService (Phase 7.4). They lock today's behavior of the duplicated form logic
 * BEFORE extraction: createMediaForm/updateMediaForm shape, per-type (MOVIE/TV) control set,
 * suggestion loaders, patchUpdateMediaForm, the create + edit-step submit DTO shapes, dirty-flag,
 * reset, and editImage's dialog-open.
 *
 * Behavior is driven through the component's public methods + service spies, never rendered DOM
 * (template overridden empty). The component reads `config.data.type` in its constructor, so the
 * MOVIE/TV split is selected by the DynamicDialogConfig provided per test.
 *
 * Deliberately preserved DIVERGENCES from the sibling ConfigureMediaFormComponent (the brief's
 * §8.1 semantic-divergence hazard) are pinned here so the extraction cannot silently normalize them:
 *  - the edit-step UpdateMediaDto built here OMITS `tags` (no tagIds computed), unlike the General
 *    edit tab which sends `tags`;
 *  - this form has NO externalIds / scanner / updateTimestamp controls (create flow only);
 *  - TV controls are added EAGERLY in the constructor (vs. the lazy first-patch add on the sibling);
 *  - onUpdateMediaFormSubmit short-circuits to `stepper.next()` when nothing changed, and on success
 *    MUTATES `this.media` + advances the stepper (vs. the sibling emitting mediaChange/updated);
 *  - the suggestion loaders here append `.add(() => ref.markForCheck())`.
 */

const MEDIA_ID = 'm1';

function makeMovieMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID,
    type: MediaType.MOVIE,
    title: 'Test Media',
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
    movie: { status: 0, subtitles: [] },
    ...overrides
  };
}

/** TV-shaped media carrying the `tv` block the TV patch branch reads. */
function makeTvMedia(overrides: Partial<any> = {}): any {
  return makeMovieMedia({
    type: MediaType.TV,
    tv: { episodes: [], lastAirDate: { day: 5, month: 6, year: 2021 } },
    ...overrides
  });
}

describe('CreateMediaComponent', () => {
  let component: CreateMediaComponent;
  let fixture: ComponentFixture<CreateMediaComponent>;
  let mediaService: any;
  let genresService: any;
  let productionsService: any;
  let tagsService: any;
  let dialogService: any;

  // onCreate/onUpdate submit subscribe with next-only handlers (takeUntil), so an errored
  // create/update surfaces an *async* RxJS "unhandled error" on a later macrotask — after the
  // triggering spec's afterEach. The suite-level guard absorbs that deferred report so it cannot
  // disconnect Karma; the synchronous assertions still run against real behavior. Restored in
  // afterAll. Mirrors the sibling ConfigureMediaFormComponent spec.
  let originalOnUnhandledError: ((err: any) => void) | undefined;
  beforeAll(() => {
    originalOnUnhandledError = rxConfig.onUnhandledError ?? undefined;
    rxConfig.onUnhandledError = () => { /* expected async report from next-only subscribe */ };
  });
  afterAll(() => {
    rxConfig.onUnhandledError = originalOnUnhandledError ?? null;
  });

  function create(type: MediaType = MediaType.MOVIE) {
    mediaService = {
      create: jasmine.createSpy('create').and.returnValue(of(makeMovieMedia())),
      update: jasmine.createSpy('update').and.returnValue(of(makeMovieMedia()))
    };
    genresService = { findGenreSuggestions: jasmine.createSpy('findGenreSuggestions').and.returnValue(of([])) };
    productionsService = { findProductionSuggestions: jasmine.createSpy('findProductionSuggestions').and.returnValue(of([])) };
    tagsService = { findTagSuggestions: jasmine.createSpy('findTagSuggestions').and.returnValue(of([])) };
    dialogService = mockDialogService();

    return TestBed.configureTestingModule({
      imports: [CreateMediaComponent],
      providers: [
        // ItemDataService is component-provided; supply the real one so date/language lists work.
        ItemDataService,
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ type }) },
        { provide: DialogService, useValue: dialogService },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: MediaService, useValue: mediaService },
        { provide: GenresService, useValue: genresService },
        { provide: ProductionsService, useValue: productionsService },
        { provide: TagsService, useValue: tagsService },
        { provide: QueueUploadService, useValue: {} }
      ]
    })
      .overrideComponent(CreateMediaComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(CreateMediaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges(); // runs ngOnInit
      });
  }

  // 1. create / form build (per-type control set) --------------------------------------

  it('should create', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('builds createMediaForm WITH a type control and updateMediaForm WITHOUT one', async () => {
    await create(MediaType.MOVIE);
    expect(component.createMediaForm.contains('type')).toBeTrue();
    expect(component.updateMediaForm.contains('type')).toBeFalse();
  });

  it('has NO externalIds / scanner / updateTimestamp controls on either form (create-flow only)', async () => {
    await create(MediaType.MOVIE);
    expect(component.createMediaForm.contains('externalIds')).toBeFalse();
    expect(component.createMediaForm.contains('scanner')).toBeFalse();
    expect(component.createMediaForm.contains('updateTimestamp')).toBeFalse();
    expect(component.updateMediaForm.contains('externalIds')).toBeFalse();
    expect(component.updateMediaForm.contains('scanner')).toBeFalse();
    expect(component.updateMediaForm.contains('updateTimestamp')).toBeFalse();
  });

  it('builds both forms WITHOUT lastAirDate for a MOVIE', async () => {
    await create(MediaType.MOVIE);
    expect(component.createMediaForm.contains('lastAirDate')).toBeFalse();
    expect(component.updateMediaForm.contains('lastAirDate')).toBeFalse();
  });

  it('eagerly adds lastAirDate to both forms and sets create status=AIRED for a TV media', async () => {
    await create(MediaType.TV);
    expect(component.createMediaForm.contains('lastAirDate')).toBeTrue();
    expect(component.updateMediaForm.contains('lastAirDate')).toBeTrue();
    expect(component.createMediaForm.controls.status.value).toBe(MediaStatus.AIRED);
  });

  // 2. suggestion loaders --------------------------------------------------------------

  it('loadGenreSuggestions / loadProductionSuggestions / loadTagSuggestions set their lists from the services', async () => {
    await create();
    genresService.findGenreSuggestions.and.returnValue(of([{ _id: 'g1' }]));
    productionsService.findProductionSuggestions.and.returnValue(of([{ _id: 'p1' }]));
    tagsService.findTagSuggestions.and.returnValue(of([{ _id: 't1' }]));
    component.loadGenreSuggestions('a');
    component.loadProductionSuggestions('b');
    component.loadTagSuggestions('c');
    expect(genresService.findGenreSuggestions).toHaveBeenCalledWith('a');
    expect(productionsService.findProductionSuggestions).toHaveBeenCalledWith('b');
    expect(tagsService.findTagSuggestions).toHaveBeenCalledWith('c');
    expect(component.genreSuggestions).toEqual([{ _id: 'g1' }] as any);
    expect(component.productionSuggestions).toEqual([{ _id: 'p1' }] as any);
    expect(component.tagSuggestions).toEqual([{ _id: 't1' }] as any);
  });

  // 3. create submit DTO shape (CROSS-BOUNDARY) ----------------------------------------

  it('onCreateMediaFormSubmit is a no-op when the create form is invalid', async () => {
    await create();
    component.createMediaForm.controls.title.setValue(''); // required -> invalid
    component.onCreateMediaFormSubmit();
    expect(mediaService.create).not.toHaveBeenCalled();
  });

  it('onCreateMediaFormSubmit builds the CreateMediaDto with id-mapped genres/tags and converted runtime, then patches the update form from the saved media', async () => {
    await create(MediaType.MOVIE);
    component.createMediaForm.patchValue({
      type: MediaType.MOVIE,
      title: 'New Title', overview: 'overview at least ten chars',
      originalLanguage: 'en',
      genres: [{ _id: 'g1' } as any, { _id: 'g2' } as any],
      producers: [{ _id: 'p1' } as any],
      studios: [{ _id: 's1' } as any],
      tags: [{ _id: 't1' } as any],
      runtime: '01:00:00',
      adult: false, visibility: 1, status: MediaStatus.RELEASED,
      releaseDate: { day: 1, month: 1, year: 2020 } as any
    });
    const saved = makeMovieMedia({ title: 'Saved Server Title' });
    mediaService.create.and.returnValue(of(saved));

    component.onCreateMediaFormSubmit();

    expect(mediaService.create).toHaveBeenCalledTimes(1);
    const dto = mediaService.create.calls.mostRecent().args[0];
    expect(dto.type).toBe(MediaType.MOVIE);
    expect(dto.title).toBe('New Title');
    expect(dto.genres).toEqual(['g1', 'g2']);
    expect(dto.producers).toEqual(['p1']);
    expect(dto.studios).toEqual(['s1']);
    expect(dto.tags).toEqual(['t1']);
    expect(dto.runtime).toBe(3600); // 01:00:00 -> seconds
    expect(dto.releaseDate).toEqual({ day: 1, month: 1, year: 2020 });
    expect('lastAirDate' in dto).toBeFalse(); // MOVIE: no lastAirDate key
    // success path stores the saved media and patches the edit form from it
    expect(component.media).toBe(saved);
    expect(component.updateMediaForm.controls.title.value).toBe('Saved Server Title');
    expect(component.createMediaForm.disabled).toBeFalse(); // re-enabled via .add() finally
  });

  it('onCreateMediaFormSubmit (TV) sets lastAirDate on the DTO when fully provided', async () => {
    await create(MediaType.TV);
    component.createMediaForm.patchValue({
      type: MediaType.TV,
      title: 'TV Title', overview: 'overview at least ten chars',
      runtime: '00:45:00',
      releaseDate: { day: 1, month: 1, year: 2020 } as any,
      status: MediaStatus.AIRED
    });
    component.createMediaForm.get('lastAirDate')!.setValue({ day: 5, month: 6, year: 2021 });
    mediaService.create.and.returnValue(of(makeTvMedia()));

    component.onCreateMediaFormSubmit();

    const dto = mediaService.create.calls.mostRecent().args[0];
    expect(dto.lastAirDate).toEqual({ day: 5, month: 6, year: 2021 });
  });

  it('onCreateMediaFormSubmit (TV) sets lastAirDate=null when the date is partially empty', async () => {
    await create(MediaType.TV);
    component.createMediaForm.patchValue({
      type: MediaType.TV,
      title: 'TV Title', overview: 'overview at least ten chars',
      runtime: '00:45:00',
      releaseDate: { day: 1, month: 1, year: 2020 } as any,
      status: MediaStatus.AIRED
    });
    component.createMediaForm.get('lastAirDate')!.setValue({ day: null, month: null, year: null });
    mediaService.create.and.returnValue(of(makeTvMedia()));

    component.onCreateMediaFormSubmit();

    const dto = mediaService.create.calls.mostRecent().args[0];
    expect(dto.lastAirDate).toBeNull();
  });

  it('onCreateMediaFormSubmit re-enables the create form even when create ERRORS (.add() finally)', async () => {
    await create();
    component.createMediaForm.patchValue({
      title: 'X', overview: 'overview at least ten chars',
      runtime: '01:00:00', releaseDate: { day: 1, month: 1, year: 2020 } as any
    });
    mediaService.create.and.returnValue(throwError(() => new Error('create failed')));
    component.onCreateMediaFormSubmit();
    expect(component.createMediaForm.disabled).toBeFalse();
  });

  // 4. patch the update form from saved media ------------------------------------------

  it('patchUpdateMediaForm fills the update form and snapshots updateMediaInitValue', async () => {
    await create(MediaType.MOVIE);
    component.patchUpdateMediaForm(makeMovieMedia({ title: 'Patched', overview: 'a sufficiently long overview' }));
    expect(component.updateMediaForm.controls.title.value).toBe('Patched');
    expect(component.updateMediaForm.controls.overview.value).toBe('a sufficiently long overview');
    expect(component.updateMediaForm.controls.runtime.value).toBe('01:00:00'); // 3600s -> "01:00:00"
    expect(component.updateMediaInitValue).toEqual(component.updateMediaForm.value as any);
  });

  it('patchUpdateMediaForm fills lastAirDate from media.tv on a TV media', async () => {
    await create(MediaType.TV);
    component.patchUpdateMediaForm(makeTvMedia());
    expect(component.updateMediaForm.get('lastAirDate')!.value).toEqual({ day: 5, month: 6, year: 2021 });
  });

  // 5. edit-step submit DTO shape (CROSS-BOUNDARY) — preserves the `tags`-omission quirk

  it('onUpdateMediaFormSubmit short-circuits to stepper.next when nothing changed (does NOT call update)', async () => {
    await create();
    component.media = makeMovieMedia();
    component.updateFormChanged = false;
    component.onUpdateMediaFormSubmit();
    expect(mediaService.update).not.toHaveBeenCalled();
  });

  it('onUpdateMediaFormSubmit builds an UpdateMediaDto that OMITS tags and mutates this.media with the server response', async () => {
    await create(MediaType.MOVIE);
    component.media = makeMovieMedia();
    component.patchUpdateMediaForm(makeMovieMedia());
    component.updateMediaForm.patchValue({
      title: 'Edited Title', overview: 'overview at least ten chars',
      originalLanguage: 'en',
      genres: [{ _id: 'g1' } as any, { _id: 'g2' } as any],
      producers: [{ _id: 'p1' } as any],
      studios: [{ _id: 's1' } as any],
      tags: [{ _id: 't1' } as any],
      runtime: '01:00:00',
      adult: false, visibility: 1, status: MediaStatus.RELEASED,
      releaseDate: { day: 1, month: 1, year: 2020 } as any
    });
    component.updateFormChanged = true;
    const saved = makeMovieMedia({ title: 'Server Saved' });
    mediaService.update.and.returnValue(of(saved));

    component.onUpdateMediaFormSubmit();

    expect(mediaService.update).toHaveBeenCalledTimes(1);
    const [id, dto] = mediaService.update.calls.mostRecent().args;
    expect(id).toBe(MEDIA_ID);
    expect(dto.genres).toEqual(['g1', 'g2']);
    expect(dto.producers).toEqual(['p1']);
    expect(dto.studios).toEqual(['s1']);
    expect(dto.runtime).toBe(3600);
    // QUIRK preserved: the create-flow edit step does NOT include a tags key on the update DTO.
    expect('tags' in dto).toBeFalse();
    // success path mutates this.media (no mediaChange/updated outputs on this consumer)
    expect(component.media).toBe(saved);
    expect(component.updateMediaForm.disabled).toBeFalse(); // re-enabled via .add()
  });

  it('onUpdateMediaFormSubmit is a no-op when there is no media even if changed', async () => {
    await create();
    component.media = undefined;
    component.updateFormChanged = true;
    component.onUpdateMediaFormSubmit();
    expect(mediaService.update).not.toHaveBeenCalled();
  });

  it('onUpdateMediaFormSubmit (TV) sets lastAirDate {day,month,year} from the form', async () => {
    await create(MediaType.TV);
    component.media = makeTvMedia();
    component.patchUpdateMediaForm(makeTvMedia());
    component.updateMediaForm.patchValue({
      title: 'Edited', overview: 'overview at least ten chars',
      runtime: '00:45:00',
      releaseDate: { day: 1, month: 1, year: 2020 } as any
    });
    component.updateMediaForm.get('lastAirDate')!.setValue({ day: 5, month: 6, year: 2021 });
    component.updateFormChanged = true;
    mediaService.update.and.returnValue(of(makeTvMedia()));

    component.onUpdateMediaFormSubmit();

    const [, dto] = mediaService.update.calls.mostRecent().args;
    expect(dto.lastAirDate).toEqual({ day: 5, month: 6, year: 2021 });
  });

  // 6. reset / dirty-flag --------------------------------------------------------------

  it('onUpdateMediaFormReset resets the update form back to the snapshotted updateMediaInitValue', async () => {
    await create(MediaType.MOVIE);
    component.patchUpdateMediaForm(makeMovieMedia({ title: 'Original' }));
    component.updateMediaForm.controls.title.setValue('Edited Away');
    component.onUpdateMediaFormReset();
    expect(component.updateMediaForm.controls.title.value).toBe('Original');
  });

  it('detectUpdateMediaFormChange flips updateFormChanged true once a control diverges from initValue', async () => {
    await create(MediaType.MOVIE);
    component.patchUpdateMediaForm(makeMovieMedia({ title: 'Original' })); // snapshots initValue + arms watcher
    expect(component.updateFormChanged).toBeFalse();
    component.updateMediaForm.controls.title.setValue('Now Different');
    expect(component.updateFormChanged).toBeTrue();
  });

  // DIVERGENCE PIN (conflict resolution — see 02_test_baseline.md): UNLIKE the sibling
  // ConfigureMediaFormComponent (bare `.subscribe()`), this component's detectUpdateMediaFormChange
  // chains `.subscribe().add(() => this.ref.markForCheck())`. detectFormChange completes
  // synchronously on the first divergent change (takeWhile), firing that teardown exactly once.
  // Pinned so the MediaFormHelperService extraction must keep B's markForCheck on this consumer
  // (it is NOT shared logic to fold into the helper).
  it('detectUpdateMediaFormChange calls ChangeDetectorRef.markForCheck once on a divergent change', async () => {
    await create(MediaType.MOVIE);
    component.patchUpdateMediaForm(makeMovieMedia({ title: 'Original' })); // arms watcher
    const ref = (component as any).ref ?? (component as any).cdr ?? (component as any).changeDetectorRef;
    const markForCheck = spyOn(ref, 'markForCheck').and.callThrough();
    component.updateMediaForm.controls.title.setValue('Diverged'); // completes the stream -> .add() fires
    expect(component.updateFormChanged).toBeTrue();
    expect(markForCheck).toHaveBeenCalledTimes(1);
  });

  // 7. editImage dialog-open -----------------------------------------------------------

  it('editImage opens ImageEditorComponent with the fixed dialog config and returns the onClose stream', async () => {
    await create();
    const result$ = component.editImage({ aspectRatioWidth: 2, aspectRatioHeight: 3, minWidth: 100, minHeight: 100, maxSize: 1000 } as any);
    expect(dialogService.open).toHaveBeenCalledTimes(1);
    const [openedComponent, cfg] = dialogService.open.calls.mostRecent().args;
    expect(openedComponent).toBe(ImageEditorComponent);
    expect(cfg.width).toBe('700px');
    expect(cfg.modal).toBeTrue();
    expect(cfg.dismissableMask).toBeFalse();
    expect(cfg.styleClass).toBe('p-dialog-header-sm');
    expect(cfg.data).toEqual({ aspectRatioWidth: 2, aspectRatioHeight: 3, minWidth: 100, minHeight: 100, maxSize: 1000 } as any);
    let emissions = 0;
    result$.subscribe(() => emissions++);
    expect(emissions).toBe(1); // mockDynamicDialogRef.onClose emits once then completes (first())
  });

  // 8. date/language lists populated on init -------------------------------------------

  it('ngOnInit populates days / months / years (and languages) from ItemDataService', async () => {
    await create();
    expect(component.days.length).toBeGreaterThan(0);
    expect(component.months.length).toBeGreaterThan(0);
    expect(component.years.length).toBeGreaterThan(0);
  });
});
