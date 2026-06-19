import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError, config as rxConfig } from 'rxjs';

import { DialogService } from 'primeng/dynamicdialog';

import { ConfigureMediaFormComponent } from './configure-media-form.component';
import { CollectionService, GenresService, ItemDataService, MediaService, ProductionsService, TagsService } from '../../../../../../core/services';
import { MediaStatus, MediaType } from '../../../../../../core/enums';
import { mockDialogService, mockDynamicDialogRef, mockTranslocoService } from '../../../../../../../testing/test-helpers';

/**
 * Characterization tests for the extracted ConfigureMediaFormComponent (General edit-form tab).
 * Re-homed from the parent spec's `form concern` + `form submit DTO` + MOVIE form-build blocks;
 * assertions are unchanged, only the receiver is adapted: behavior is driven through signal inputs
 * (media/t/parentDialogRef) + service spies, never rendered DOM. The patch path is exercised through
 * the `media` input (HAZARD-2 design A — a reactive effect patches the form), and submit emits
 * `mediaChange(full saved media)` instead of mutating shared state (HAZARD-3).
 *
 * Beyond the moved behavior, this proves the DI: the child provides its OWN DestroyService (the one
 * legitimate per-component teardown `providers` entry, NOT the NG0201 trap) and resolves ItemDataService
 * up-tree. The TV-only form controls (lastAirDate / scanner.tvSeason) are added on the first patch
 * guarded by media().type, so the per-type form shape + UpdateMediaDto shape match the pre-split monolith.
 * The footer<->form cross-DOM bridge (HAZARD-1) is integration-qa's live-render target, NOT pinned here.
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Test Media';

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
    externalIds: { tmdb: null, imdb: null, aniList: null, mal: null },
    scanner: { enabled: false },
    movie: { status: 0, subtitles: [] },
    ...overrides
  };
}

/** TV-shaped media with the `tv` block + scanner the TV patch branch reads. */
function makeTvMedia(overrides: Partial<any> = {}): any {
  return makeMovieMedia({
    type: MediaType.TV,
    tv: { episodes: [], lastAirDate: { day: 5, month: 6, year: 2021 } },
    scanner: { enabled: true, tvSeason: 2 },
    ...overrides
  });
}

describe('ConfigureMediaFormComponent', () => {
  let component: ConfigureMediaFormComponent;
  let fixture: ComponentFixture<ConfigureMediaFormComponent>;
  let mediaService: any;
  let genresService: any;
  let productionsService: any;
  let tagsService: any;
  let collectionService: any;

  // onUpdateMediaFormSubmit subscribes with a next-only handler (takeUntil), so an errored update
  // reports an *async* RxJS "unhandled error" on a later macrotask — after the triggering spec's
  // afterEach. The suite-level guard absorbs that deferred report so it cannot disconnect Karma; the
  // synchronous assertions still run against real behavior. Restored in afterAll. Mirrors the
  // parent / Source / Videos specs.
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
      update: jasmine.createSpy('update').and.returnValue(of(makeMovieMedia()))
    };
    genresService = { findGenreSuggestions: jasmine.createSpy('findGenreSuggestions').and.returnValue(of([])) };
    productionsService = { findProductionSuggestions: jasmine.createSpy('findProductionSuggestions').and.returnValue(of([])) };
    tagsService = { findTagSuggestions: jasmine.createSpy('findTagSuggestions').and.returnValue(of([])) };
    collectionService = { findCollectionSuggestions: jasmine.createSpy('findCollectionSuggestions').and.returnValue(of([])) };

    return TestBed.configureTestingModule({
      imports: [ConfigureMediaFormComponent],
      providers: [
        // ItemDataService is the real (component-provided up-tree) service; supply it directly here.
        ItemDataService,
        { provide: MediaService, useValue: mediaService },
        { provide: GenresService, useValue: genresService },
        { provide: ProductionsService, useValue: productionsService },
        { provide: TagsService, useValue: tagsService },
        { provide: CollectionService, useValue: collectionService },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() }
      ]
    })
      .overrideComponent(ConfigureMediaFormComponent, { set: { template: '', imports: [] } })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ConfigureMediaFormComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('media', media);
        fixture.componentRef.setInput('t', (key: string) => key);
        fixture.componentRef.setInput('parentDialogRef', mockDynamicDialogRef());
        fixture.detectChanges(); // runs ngOnInit + flushes the patch effect
      });
  }

  // 1. create / form build + DI --------------------------------------------------------

  it('should create (provides its own DestroyService, resolves ItemDataService — no NG0201)', async () => {
    await create();
    expect(component).toBeTruthy();
  });

  it('builds updateMediaForm without lastAirDate for a MOVIE', async () => {
    await create(makeMovieMedia());
    expect(component.updateMediaForm.contains('lastAirDate')).toBeFalse();
  });

  it('builds updateMediaForm WITH lastAirDate + scanner.tvSeason for a TV media', async () => {
    await create(makeTvMedia());
    expect(component.updateMediaForm.contains('lastAirDate')).toBeTrue();
    expect(component.updateMediaForm.controls.scanner.contains('tvSeason')).toBeTrue();
  });

  // 2. patch from the media input (HAZARD-2 design A) ----------------------------------

  it('patches the form from the media input, snapshots updateMediaInitValue, and clears the dirty flag', async () => {
    await create(makeMovieMedia({ title: 'Patched', overview: 'a sufficiently long overview' }));
    expect(component.updateMediaForm.controls.title.value).toBe('Patched');
    expect(component.updateMediaForm.controls.overview.value).toBe('a sufficiently long overview');
    // runtime 3600s -> "01:00:00" via secondsToTimeString
    expect(component.updateMediaForm.controls.runtime.value).toBe('01:00:00');
    expect(component.updateMediaInitValue).toEqual(component.updateMediaForm.value as any);
    expect(component.updateMediaFormChanged).toBeFalse();
  });

  it('fills the TV lastAirDate + scanner.tvSeason from media.tv on a TV media', async () => {
    await create(makeTvMedia());
    expect(component.updateMediaForm.get('lastAirDate')!.value).toEqual({ day: 5, month: 6, year: 2021 });
    expect(component.updateMediaForm.controls.scanner.get('tvSeason')!.value).toBe(2);
  });

  it('a second media input emission re-patches the form and clears dirty (socket-refresh path)', async () => {
    await create(makeMovieMedia({ title: 'First' }));
    component.updateMediaForm.controls.title.setValue('User Edited');
    expect(component.updateMediaFormChanged).toBeTrue();
    fixture.componentRef.setInput('media', makeMovieMedia({ title: 'Refreshed' }));
    fixture.detectChanges(); // effect re-fires -> re-patch + re-snapshot + clear dirty
    expect(component.updateMediaForm.controls.title.value).toBe('Refreshed');
    expect(component.updateMediaFormChanged).toBeFalse();
  });

  // 3. submit DTO shape (CROSS-BOUNDARY) -----------------------------------------------

  it('onUpdateMediaFormSubmit builds the UpdateMediaDto with id-mapped genres and converted runtime, then emits mediaChange + updated', async () => {
    await create();
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
    const saved = makeMovieMedia({ title: 'Saved Server Title' });
    mediaService.update.and.returnValue(of(saved));
    let emitted: any; let updated = false;
    component.mediaChange.subscribe(m => (emitted = m));
    component.updated.subscribe(() => (updated = true));
    component.onUpdateMediaFormSubmit();
    expect(mediaService.update).toHaveBeenCalledTimes(1);
    const [id, dto] = mediaService.update.calls.mostRecent().args;
    expect(id).toBe(MEDIA_ID);
    expect(dto.genres).toEqual(['g1', 'g2']);
    expect(dto.producers).toEqual(['p1']);
    expect(dto.studios).toEqual(['s1']);
    expect(dto.tags).toEqual(['t1']);
    expect(dto.runtime).toBe(3600); // 01:00:00 -> seconds
    expect(emitted).toBe(saved);
    expect(updated).toBeTrue();
  });

  it('onUpdateMediaFormSubmit is a no-op when the form is invalid', async () => {
    await create();
    component.updateMediaForm.controls.title.setValue('');
    component.updateMediaForm.controls.title.setErrors({ required: true });
    component.onUpdateMediaFormSubmit();
    expect(mediaService.update).not.toHaveBeenCalled();
  });

  it('onUpdateMediaFormSubmit (MOVIE) builds a DTO with NO lastAirDate key and NO scanner.tvSeason', async () => {
    await create(makeMovieMedia());
    component.updateMediaForm.patchValue({ runtime: '01:00:00' });
    component.onUpdateMediaFormSubmit();
    const [, dto] = mediaService.update.calls.mostRecent().args;
    expect('lastAirDate' in dto).toBeFalse();
    expect(dto.scanner.tvSeason).toBeUndefined();
  });

  it('onUpdateMediaFormSubmit (TV) sets lastAirDate {day,month,year} and scanner.tvSeason from the form', async () => {
    await create(makeTvMedia());
    component.updateMediaForm.patchValue({ runtime: '00:45:00' });
    component.updateMediaForm.get('lastAirDate')!.setValue({ day: 5, month: 6, year: 2021 });
    component.updateMediaForm.controls.scanner.get('tvSeason')!.setValue(2);
    mediaService.update.and.returnValue(of(makeTvMedia()));
    component.onUpdateMediaFormSubmit();
    const [, dto] = mediaService.update.calls.mostRecent().args;
    expect(dto.lastAirDate).toEqual({ day: 5, month: 6, year: 2021 });
    expect(dto.scanner.tvSeason).toBe(2);
  });

  it('onUpdateMediaFormSubmit (TV) sets lastAirDate=null when the date is partially empty', async () => {
    await create(makeTvMedia());
    component.updateMediaForm.patchValue({ runtime: '00:45:00' });
    component.updateMediaForm.get('lastAirDate')!.setValue({ day: null, month: null, year: null });
    mediaService.update.and.returnValue(of(makeTvMedia()));
    component.onUpdateMediaFormSubmit();
    const [, dto] = mediaService.update.calls.mostRecent().args;
    expect(dto.lastAirDate).toBeNull();
  });

  it('onUpdateMediaFormSubmit re-enables the form on success (via .add() finally)', async () => {
    await create();
    component.updateMediaForm.patchValue({ runtime: '01:00:00' });
    mediaService.update.and.returnValue(of(makeMovieMedia()));
    component.onUpdateMediaFormSubmit();
    expect(component.updateMediaForm.disabled).toBeFalse();
  });

  it('onUpdateMediaFormSubmit re-enables the form even when the update ERRORS (.add() finally)', async () => {
    await create();
    component.updateMediaForm.patchValue({ runtime: '01:00:00' });
    mediaService.update.and.returnValue(throwError(() => new Error('save failed')));
    component.onUpdateMediaFormSubmit();
    expect(component.updateMediaForm.disabled).toBeFalse();
  });

  // 4. reset / dirty-flag --------------------------------------------------------------

  it('onUpdateMediaFormReset resets the form back to the snapshotted updateMediaInitValue', async () => {
    await create(makeMovieMedia({ title: 'Original' }));
    component.updateMediaForm.controls.title.setValue('Edited Away');
    component.onUpdateMediaFormReset();
    expect(component.updateMediaForm.controls.title.value).toBe('Original');
  });

  it('detectUpdateMediaFormChange sets updateMediaFormChanged true once a control diverges from initValue', async () => {
    await create(makeMovieMedia({ title: 'Original' })); // patch arms the watcher + snapshots initValue
    expect(component.updateMediaFormChanged).toBeFalse();
    component.updateMediaForm.controls.title.setValue('Now Different'); // valueChanges fires -> flips true
    expect(component.updateMediaFormChanged).toBeTrue();
  });

  // DIVERGENCE PIN (conflict resolution — see 02_test_baseline.md): this component's
  // detectUpdateMediaFormChange ends in a bare `.subscribe()`; it does NOT chain
  // `.add(() => markForCheck())`. The sibling CreateMediaComponent DOES. The detectFormChange
  // stream completes synchronously on the first divergent change (takeWhile), so a `.add()` teardown
  // here would fire a markForCheck immediately — there is none, and this asserts its absence so the
  // MediaFormHelperService extraction keeps change-detection a per-component concern.
  it('detectUpdateMediaFormChange does NOT call ChangeDetectorRef.markForCheck on a divergent change', async () => {
    await create(makeMovieMedia({ title: 'Original' }));
    const ref = (component as any).ref ?? (component as any).cdr ?? (component as any).changeDetectorRef;
    const markForCheck = spyOn(ref, 'markForCheck').and.callThrough();
    component.updateMediaForm.controls.title.setValue('Diverged'); // completes the detectFormChange stream
    expect(component.updateMediaFormChanged).toBeTrue(); // proves the stream fired + completed
    expect(markForCheck).not.toHaveBeenCalled();
  });

  // 5. suggestion loaders --------------------------------------------------------------

  it('loadGenreSuggestions / loadProductionSuggestions / loadTagSuggestions set their lists from the services', async () => {
    await create();
    genresService.findGenreSuggestions.and.returnValue(of([{ _id: 'g1' }]));
    productionsService.findProductionSuggestions.and.returnValue(of([{ _id: 'p1' }]));
    tagsService.findTagSuggestions.and.returnValue(of([{ _id: 't1' }]));
    component.loadGenreSuggestions('a');
    component.loadProductionSuggestions('b');
    component.loadTagSuggestions('c');
    expect(component.genreSuggestions).toEqual([{ _id: 'g1' }] as any);
    expect(component.productionSuggestions).toEqual([{ _id: 'p1' }] as any);
    expect(component.tagSuggestions).toEqual([{ _id: 't1' }] as any);
  });

  // 6. date/language lists populated on init -------------------------------------------

  it('ngOnInit populates days / months / years (and languages) from ItemDataService', async () => {
    await create();
    expect(component.days.length).toBeGreaterThan(0);
    expect(component.months.length).toBeGreaterThan(0);
    expect(component.years.length).toBeGreaterThan(0);
  });
});
