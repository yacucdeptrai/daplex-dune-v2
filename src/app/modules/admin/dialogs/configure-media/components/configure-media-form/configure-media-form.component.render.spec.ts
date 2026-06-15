import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { provideTransloco, TranslocoLoader, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { firstValueFrom, of } from 'rxjs';

/**
 * Structural shape of the PrimeNG AutoComplete instance the keep-open test drives. We resolve it by
 * shape (not `instanceof AutoComplete` / a bare class import) — importing the standalone `AutoComplete`
 * class into the spec re-registers its `Bind` hostDirective and throws NG0309 on the rendered control.
 */
interface AutoCompleteLike {
  suggestions: unknown[];
  overlayVisible: boolean | undefined;
  show(isFocus?: boolean): void;
  hide(isFocus?: boolean): void;
  modelValue(): any[] | undefined;
}

import { ConfigureMediaComponent } from '../../configure-media.component';
import { ConfigureMediaFormComponent } from './configure-media-form.component';
import { ConfirmActionService, GenresService, MediaService, ProductionsService, TagsService } from '../../../../../../core/services';
import { WsService } from '../../../../../../shared/modules/ws';
import { MediaPStatus, MediaSourceStatus, MediaStatus, MediaType } from '../../../../../../core/enums';
import {
  mockDialogService,
  mockDynamicDialogConfig,
  mockDynamicDialogRef,
  provideMockActivatedRoute,
  provideTranslocoTesting
} from '../../../../../../../testing/test-helpers';

/**
 * HAZARD-1 FOOTER-BRIDGE live render — adopted as a permanent guard.
 *
 * The Form tab is unique: the save/cancel `appPanelToast` footer STAYS in the PARENT (content
 * projection via @ContentChildren cannot cross the child-component boundary) while the
 * <form id="update-media-form"> moved INTO the child. The footer reaches the child through
 * #formCmp exposed members ([visible]="formCmp.updateMediaFormChanged",
 * [formGroup]="formCmp.updateMediaForm", (click)="formCmp.onUpdateMediaFormReset()") and the
 * submit button bridges via the native form="update-media-form" association across the DOM gap.
 *
 * AOT compiles this and the stubbed-template unit specs pass even if the bridge is broken, so this
 * is the ONLY thing that proves the seam at runtime. It mounts the PARENT ConfigureMediaComponent
 * UN-STUBBED (real template -> real <app-vertical-tab> projecting the real form child + the real
 * footer) in ChromeHeadless with provideNoopAnimations (so the @tabPanelToast slide + vertical-tab
 * animations resolve synchronously), then: confirms the General form renders on open, dirties a
 * control, confirms the floating footer appears, clicks the form-associated submit (must fire the
 * CHILD's onUpdateMediaFormSubmit -> mediaService.update), and clicks cancel (must reset via the
 * child + hide the footer).
 */

const MEDIA_ID = 'm1';
const MEDIA_TITLE = 'Bridge QA Media';

function makeTvMedia(overrides: Partial<any> = {}): any {
  return {
    _id: MEDIA_ID, type: MediaType.TV, title: MEDIA_TITLE,
    originalTitle: '', overview: 'an overview long enough', originalLang: 'en',
    genres: [], studios: [], producers: [], tags: [],
    runtime: 3600, adult: false,
    releaseDate: { day: 1, month: 1, year: 2020 },
    visibility: 1, status: MediaStatus.RELEASED, pStatus: MediaPStatus.DONE,
    externalIds: { tmdb: null, imdb: null, aniList: null, mal: null },
    scanner: { enabled: false },
    videos: [],
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    tv: { episodes: [], lastAirDate: { day: 5, month: 6, year: 2021 } },
    ...overrides
  };
}

describe('ConfigureMediaFormComponent — HAZARD-1 footer<->form bridge (live parent render)', () => {
  let fixture: ComponentFixture<ConfigureMediaComponent>;
  let mediaService: any;

  beforeEach(async () => {
    mediaService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of(makeTvMedia())),
      update: jasmine.createSpy('update').and.returnValue(of(makeTvMedia({ title: 'Saved Server Title' }))),
      deleteMovieSubtitle: jasmine.createSpy('deleteMovieSubtitle').and.returnValue(of(undefined)),
      findMovieStreams: jasmine.createSpy('findMovieStreams').and.returnValue(of({})),
      deleteMovieSource: jasmine.createSpy('deleteMovieSource').and.returnValue(of(undefined)),
      findAllTVEpisodes: jasmine.createSpy('findAllTVEpisodes').and.returnValue(of([])),
      deleteTVEpisode: jasmine.createSpy('deleteTVEpisode').and.returnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      // Real PARENT, REAL template (NO overrideComponent stub) — the whole point.
      imports: [ConfigureMediaComponent],
      providers: [
        provideNoopAnimations(),
        // The form child injects root GenresService/ProductionsService/TagsService (HTTP base -> custom
        // cache manager). They are irrelevant to the footer<->form bridge under test, so stub them (the
        // child's own unit spec does the same); this avoids dragging the app HTTP cache into the render.
        { provide: GenresService, useValue: { findGenreSuggestions: () => of([]) } },
        { provide: ProductionsService, useValue: { findProductionSuggestions: () => of([]) } },
        { provide: TagsService, useValue: { findTagSuggestions: () => of([]) } },
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: MEDIA_ID, type: MediaType.TV, title: MEDIA_TITLE }) },
        { provide: DialogService, useValue: mockDialogService() },
        // Route-scoped tokens supplied by the surrounding injector (never re-provided by a child).
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        // The real <app-vertical-tab> renders a PrimeNG TabMenu that injects ActivatedRoute.
        provideMockActivatedRoute(),
        // Real Transloco (reRenderOnLangChange:false, empty loader -> missing keys fall through to the
        // key string) so the parent's `*transloco` directive initializes and the real template renders.
        provideTranslocoTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigureMediaComponent);
    fixture.detectChanges();        // ngOnInit -> loadMedia(findOne) -> media set -> form child instantiates + patch effect
  });

  /** The child form component instance, reached through the parent's #formCmp (the projected child). */
  function formChild(): ConfigureMediaFormComponent {
    const de = fixture.debugElement.query((d: any) => d.componentInstance instanceof ConfigureMediaFormComponent);
    expect(de).withContext('the Form child must render inside the parent General tab').toBeTruthy();
    return de.componentInstance as ConfigureMediaFormComponent;
  }

  it('renders the General form (child) on open as the default tab — the #formCmp bridge target exists', () => {
    const host: HTMLElement = fixture.nativeElement;
    // The child renders the real <form id="update-media-form"> (the native submit-association target).
    const form = host.querySelector('form#update-media-form');
    expect(form).withContext('<form id="update-media-form"> must render in the child under the General tab').toBeTruthy();
    // The child instance is reachable (parent's #formCmp resolves to a real component).
    expect(formChild()).toBeTruthy();
    expect(formChild().updateMediaForm).withContext('exposed FormGroup the footer binds').toBeTruthy();
  });

  it('footer is HIDDEN while the form is pristine (formCmp.updateMediaFormChanged is false)', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(formChild().updateMediaFormChanged).withContext('pristine after patch').toBeFalse();
    // The appPanelToast footer is gated by toast.visible -> not rendered yet.
    const submitBefore = host.querySelector('button[type="submit"][form="update-media-form"]');
    expect(submitBefore).withContext('footer (and its submit button) should not be in the DOM while pristine').toBeNull();
  });

  it('dirtying a control makes the floating footer appear, and the form-associated submit fires the CHILD ngSubmit', fakeAsync(() => {
    const host: HTMLElement = fixture.nativeElement;
    const child = formChild();

    // Dirty a real control (the patch effect already armed the dirty watcher on load).
    child.updateMediaForm.controls.title.setValue('Edited By QA');
    tick();                         // detectFormChange valueChanges -> flips updateMediaFormChanged true
    fixture.detectChanges();
    flush();                        // flush @tabPanelToast slide animation (NoopAnimations)
    fixture.detectChanges();

    expect(child.updateMediaFormChanged).withContext('form is now dirty').toBeTrue();

    // The floating footer is now projected + rendered (vertical-tab @if toast.visible).
    const unsaved = (host.textContent || '');
    expect(unsaved).withContext('unsaved-changes footer text should render').toContain('admin.configureMedia.unsavedChanges');
    const submitBtn = host.querySelector('button[type="submit"][form="update-media-form"]') as HTMLButtonElement;
    expect(submitBtn).withContext('footer submit button must render once dirty').toBeTruthy();

    // Click the footer submit. It lives in the PARENT footer; form="update-media-form" associates it
    // with the <form> in the CHILD across the DOM gap -> must fire the child's (ngSubmit).
    const submitSpy = spyOn(child, 'onUpdateMediaFormSubmit').and.callThrough();
    submitBtn.click();
    tick();
    fixture.detectChanges();
    flush();

    expect(submitSpy).withContext('native form-association must fire the CHILD onUpdateMediaFormSubmit').toHaveBeenCalled();
    expect(mediaService.update).withContext('submit must reach mediaService.update through the child').toHaveBeenCalled();
    const [id] = mediaService.update.calls.mostRecent().args;
    expect(id).toBe(MEDIA_ID);
  }));

  it('cancel button resets the child form and hides the footer', fakeAsync(() => {
    const host: HTMLElement = fixture.nativeElement;
    const child = formChild();

    child.updateMediaForm.controls.title.setValue('Temp Edit');
    tick();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();
    expect(child.updateMediaFormChanged).toBeTrue();

    const resetSpy = spyOn(child, 'onUpdateMediaFormReset').and.callThrough();
    const cancelBtn = Array.from(host.querySelectorAll('button'))
      .find(b => /cancel/i.test(b.getAttribute('aria-label') || '') || /updateMedia\.cancel/.test(b.textContent || '')) as HTMLButtonElement
      // fall back: the footer's first p-button-text secondary button
      || host.querySelector('button.p-button-text.p-button-secondary') as HTMLButtonElement;
    expect(cancelBtn).withContext('footer cancel button must render').toBeTruthy();

    cancelBtn.click();
    tick();
    fixture.detectChanges();
    flush();
    fixture.detectChanges();

    expect(resetSpy).withContext('cancel must call the child onUpdateMediaFormReset via #formCmp').toHaveBeenCalled();
    // Title reset back to the patched server value; dirty flag cleared -> footer hides.
    expect(child.updateMediaForm.controls.title.value).toBe(MEDIA_TITLE);
    expect(child.updateMediaFormChanged).withContext('dirty cleared after reset').toBeFalse();
  }));
});

/**
 * DELTA-001 — collapsed "N items selected" count-summary (live parent render).
 *
 * The v17 forms rendered the genre/studio/producer/tag multiple-selects through a custom
 * `AltAutoComplete` subclass whose multiple-mode block collapsed the whole selection into a
 * SINGLE `<li.p-autocomplete-token>` fed the entire model array, displaying the `selectedItems`
 * i18n plural ("N items selected"), hidden while focused. The v21 migration swapped each control
 * to stock `<p-autoComplete [multiple]="true">`, which renders ONE `<p-chip>` (`.p-autocomplete-chip-item`)
 * PER selected item, always visible — losing the count-summary. The user REJECTED that delta
 * (DELTA-001), so the surgeon re-ports the subclass (analyst brief `12_altautocomplete_brief.md`,
 * recommendation (a)) and re-wires the 8 sites back to `<p-altAutoComplete>` + a `selectedItem`
 * template feeding the plural.
 *
 * This block LOCKS the restored DESIRED behavior and is intentionally RED against the current
 * stock-chips code, proving it captures the delta. The assertions are structural (token COUNT +
 * class) so they hold regardless of which exact subclass shape the surgeon lands:
 *   - exactly ONE collapsed selected-token (`.p-autocomplete-token`) inside the genres control,
 *   - ZERO stock per-item internal chips (`.p-autocomplete-chip-item`) — the regression marker,
 *   - the token text resolves the `selectedItems` plural ("2 items selected"), not per-item labels,
 *   - the SEPARATE external `@for` chip list below still shows one chip per item (unchanged by both
 *     versions — guards the re-port from disturbing the removal list),
 *   - removing an item shrinks the model and the collapsed token re-counts ("1 item selected"),
 *   - hidden while the input is focused.
 *
 * FULL v17 PARITY (user-ruled, leader-confirmed) also restores `[hideOnSelect]="false"` on the 4
 * configure-media-form sites: picking an option must KEEP THE PANEL OPEN. v17 wired the items-loop click
 * to `onOptionSelect($event, option, hideOnSelect)` (isHide=false); stock v21 hardcodes
 * `onOptionSelect($event, option)` (isHide defaults true -> the panel closes). The keep-open test below
 * exercises the REAL items-loop click and asserts `overlayVisible` stays true — RED against the current
 * close-on-select default, GREEN once the subclass re-adds the `hideOnSelect` wiring.
 *
 * A real (non-empty) transloco loader supplies the admin scope so `t('admin.updateMedia.selectedItems',
 * {itemCount})` resolves the ICU plural at render time (the shared `provideTranslocoTesting()` empty
 * loader would leave the key string, masking the text assertion).
 */

const GENRE_A = { _id: 'g1', name: 'Action' } as any;
const GENRE_B = { _id: 'g2', name: 'Comedy' } as any;

/**
 * Real admin-scope translations so `selectedItems` resolves at render time.
 *
 * The parent's `*transloco="let t"` directive path-WALKS the key (`admin` -> `updateMedia` ->
 * `selectedItems`), so the loader must return a NESTED tree, not flat dotted keys (a flat
 * `'admin.updateMedia.selectedItems'` key only satisfies `translate()`'s direct lookup, not the
 * directive — that mismatch is exactly what left the token rendering the raw key). The same nested
 * object is returned for the global lang AND every scope path the parent loads (`common`/`languages`),
 * which is harmless — only the global `admin.*` branch is read here.
 */
const SELECTED_ITEMS_ICU = '{ itemCount, plural, one {1 item selected} other {# items selected} }';
class AdminTranslocoLoader implements TranslocoLoader {
  getTranslation() {
    return of({
      admin: {
        createMedia: { selectedItems: SELECTED_ITEMS_ICU },
        // The 4 update/configure sites read updateMedia.selectedItems, which aliases createMedia's plural
        // (matches en.json:75/175). Inline the ICU directly so resolution doesn't depend on alias support.
        updateMedia: { selectedItems: SELECTED_ITEMS_ICU }
      }
    });
  }
}

function makeMovieWithGenres(genres: any[]): any {
  return {
    _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE,
    originalTitle: '', overview: 'an overview long enough', originalLang: 'en',
    genres, studios: [], producers: [], tags: [],
    runtime: 3600, adult: false,
    releaseDate: { day: 1, month: 1, year: 2020 },
    visibility: 1, status: MediaStatus.RELEASED, pStatus: MediaPStatus.DONE,
    externalIds: { tmdb: null, imdb: null, aniList: null, mal: null },
    scanner: { enabled: false },
    videos: [],
    movie: { status: MediaSourceStatus.DONE, subtitles: [] },
    tv: { episodes: [], lastAirDate: null }
  };
}

describe('ConfigureMediaFormComponent — DELTA-001 collapsed count-summary (live parent render)', () => {
  let fixture: ComponentFixture<ConfigureMediaComponent>;

  beforeEach(async () => {
    const mediaService = {
      findOne: jasmine.createSpy('findOne').and.returnValue(of(makeMovieWithGenres([GENRE_A, GENRE_B]))),
      update: jasmine.createSpy('update').and.returnValue(of(makeMovieWithGenres([GENRE_A, GENRE_B]))),
      deleteMovieSubtitle: jasmine.createSpy('deleteMovieSubtitle').and.returnValue(of(undefined)),
      findMovieStreams: jasmine.createSpy('findMovieStreams').and.returnValue(of({})),
      deleteMovieSource: jasmine.createSpy('deleteMovieSource').and.returnValue(of(undefined)),
      findAllTVEpisodes: jasmine.createSpy('findAllTVEpisodes').and.returnValue(of([])),
      deleteTVEpisode: jasmine.createSpy('deleteTVEpisode').and.returnValue(of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [ConfigureMediaComponent],
      providers: [
        provideNoopAnimations(),
        { provide: GenresService, useValue: { findGenreSuggestions: () => of([]) } },
        { provide: ProductionsService, useValue: { findProductionSuggestions: () => of([]) } },
        { provide: TagsService, useValue: { findTagSuggestions: () => of([]) } },
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        { provide: DynamicDialogConfig, useValue: mockDynamicDialogConfig({ _id: MEDIA_ID, type: MediaType.MOVIE, title: MEDIA_TITLE }) },
        { provide: DialogService, useValue: mockDialogService() },
        ConfirmationService,
        ConfirmActionService,
        { provide: MediaService, useValue: mediaService },
        { provide: WsService, useValue: { fromEvent: () => of(), joinRoom: () => undefined, leaveRoom: () => undefined } },
        provideMockActivatedRoute(),
        // Real (non-empty) loader so the `selectedItems` ICU plural resolves to "N items selected".
        // logMissingKey:false keeps the form's other (unprovided) keys silent — they're irrelevant
        // here and would otherwise flood console.warn noise.
        provideTransloco({
          config: {
            availableLangs: ['en'], defaultLang: 'en', reRenderOnLangChange: false, prodMode: false,
            missingHandler: { logMissingKey: false, useFallbackTranslation: false, allowEmpty: true }
          },
          loader: AdminTranslocoLoader
        }),
        // Messageformat transpiler (mirrors transloco-root.module.ts:41) so the `{ itemCount, plural }`
        // ICU in `selectedItems` resolves at render time instead of leaving the raw string.
        provideTranslocoMessageformat({ locales: ['en-US', 'vi-VN'] })
      ]
    }).compileComponents();

    // Load the active lang BEFORE the first render so the parent's `*transloco="let t; loadingTpl"`
    // directive resolves immediately (otherwise it shows the loading template / raw key while the
    // async getTranslation settles, and the count-summary token reads back the unresolved key).
    const transloco = TestBed.inject(TranslocoService);
    transloco.setActiveLang('en');
    await firstValueFrom(transloco.load('en'));

    fixture = TestBed.createComponent(ConfigureMediaComponent);
    fixture.detectChanges();        // ngOnInit -> findOne -> media set -> form child patches genres [A,B]
  });

  /** Root element of the genres autocomplete (resolved via its inner inputId="genres"). */
  function genresAutoComplete(): HTMLElement {
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector('#genres') as HTMLElement | null;
    expect(input).withContext('the genres multiple-select input (#genres) must render').toBeTruthy();
    const ac = input!.closest('p-autocomplete, p-autoComplete, p-altAutoComplete, p-auto-complete') as HTMLElement | null;
    expect(ac).withContext('genres input must live inside an autocomplete host element').toBeTruthy();
    return ac!;
  }

  /** The genres AutoComplete component instance (the configure-media-form #genreAC control). */
  function genresAutoCompleteInstance(): AutoCompleteLike {
    const ac = genresAutoComplete();
    // Match by shape (has show()/overlayVisible/modelValue) — never `instanceof AutoComplete` (NG0309).
    const de = fixture.debugElement
      .queryAll((d: any) => {
        const c = d.componentInstance;
        return !!c && typeof c.show === 'function' && typeof c.modelValue === 'function'
          && 'overlayVisible' in c && ac.contains(d.nativeElement);
      })[0];
    expect(de).withContext('genres AutoComplete component instance must resolve').toBeTruthy();
    return de.componentInstance as AutoCompleteLike;
  }

  /** The external removal chip list rendered BELOW the genres control (the sibling @for, md:w-2/3). */
  function externalGenreChips(): HTMLElement[] {
    const host: HTMLElement = fixture.nativeElement;
    // The external list lives in the row's md:w-2/3 column, OUTSIDE the autocomplete host.
    const ac = genresAutoComplete();
    return Array.from(host.querySelectorAll('p-chip'))
      .filter(chip => !ac.contains(chip)) as HTMLElement[];
  }

  it('the form patches both genres into the control on load (precondition for the count-summary)', () => {
    const de = fixture.debugElement.query((d: any) => d.componentInstance instanceof ConfigureMediaFormComponent);
    const child = de.componentInstance as ConfigureMediaFormComponent;
    expect(child.updateMediaForm.controls.genres.value?.length)
      .withContext('genres control seeded with 2 objects').toBe(2);
  });

  it('renders ONE collapsed count-summary token (not two internal per-item chips) for 2 selected genres', () => {
    const ac = genresAutoComplete();

    // DESIRED (v17, restored): exactly one collapsed selected-token inside the control.
    const collapsedTokens = ac.querySelectorAll('.p-autocomplete-token');
    expect(collapsedTokens.length)
      .withContext('genres control must show exactly ONE collapsed count-summary token')
      .toBe(1);

    // REGRESSION marker (current stock v21): per-item internal chips must NOT be rendered.
    const internalChipItems = ac.querySelectorAll('.p-autocomplete-chip-item');
    expect(internalChipItems.length)
      .withContext('stock v21 per-item internal chips (.p-autocomplete-chip-item) must NOT render inside the control')
      .toBe(0);
  });

  it('the collapsed token text is the resolved "2 items selected" plural, not the individual genre labels', () => {
    const ac = genresAutoComplete();
    const token = ac.querySelector('.p-autocomplete-token') as HTMLElement;
    expect(token).withContext('collapsed token must exist').toBeTruthy();

    const text = (token.textContent || '').trim();
    expect(text)
      .withContext('the collapsed token must show the selectedItems count-summary')
      .toContain('2 items selected');
    // It is a COUNT summary, not a chip list: the per-item names must not appear in the token.
    expect(text)
      .withContext('the collapsed token must not render the individual genre labels')
      .not.toContain(GENRE_A.name);
    expect(text).not.toContain(GENRE_B.name);
  });

  it('keeps the SEPARATE external @for chip list (below the control) showing one chip per genre', () => {
    // The external removal chip list is unchanged by both versions — it stays one chip per item.
    const externalChips = externalGenreChips();
    expect(externalChips.length)
      .withContext('the external removal chip list must still show 2 individual genre chips')
      .toBe(2);
    const externalText = externalChips.map(c => (c.textContent || '').trim()).join(' ');
    expect(externalText).withContext('external chips show the genre labels').toContain(GENRE_A.name);
    expect(externalText).toContain(GENRE_B.name);
  });

  it('re-counts the collapsed token to "1 item selected" after one genre is removed from the model', () => {
    const de = fixture.debugElement.query((d: any) => d.componentInstance instanceof ConfigureMediaFormComponent);
    const child = de.componentInstance as ConfigureMediaFormComponent;

    // Removal path the external chip @for uses: setValue with the filtered array.
    child.updateMediaForm.controls.genres.setValue([GENRE_A]);
    fixture.detectChanges();

    const ac = genresAutoComplete();
    const tokens = ac.querySelectorAll('.p-autocomplete-token');
    expect(tokens.length).withContext('still a single collapsed token after removal').toBe(1);
    expect((tokens[0].textContent || '').trim())
      .withContext('count-summary re-resolves the plural after removal')
      .toContain('1 item selected');
    // External list also drops to a single chip.
    expect(externalGenreChips().length).withContext('external chip list shrinks to 1').toBe(1);
  });

  it('keeps the suggestions panel OPEN after selecting an option (restored [hideOnSelect]="false")', fakeAsync(() => {
    const ac = genresAutoCompleteInstance();

    // Seed a suggestion not already selected, open the overlay, render the option list.
    const newGenre = { _id: 'g3', name: 'Drama' } as any;
    ac.suggestions = [newGenre];
    ac.show();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(ac.overlayVisible).withContext('overlay must be open before the pick').toBeTrue();

    // The option panel renders to document.body (appendTo="body"); click the REAL option <li> so the
    // items-loop (click)="onOptionSelect(...)" wiring fires — stock v21 closes (isHide defaults true),
    // the re-ported [hideOnSelect]="false" keeps it open.
    const option = (fixture.nativeElement.querySelector('.p-autocomplete-option')
      || document.querySelector('.p-autocomplete-option')) as HTMLElement | null;
    expect(option).withContext('a suggestion option must render in the open panel').toBeTruthy();

    option!.click();
    tick();
    fixture.detectChanges();
    flush();

    // The selection must have been applied (model grew) AND the panel must remain open.
    expect(ac.modelValue()?.some((g: any) => g._id === newGenre._id))
      .withContext('the picked option must be added to the model').toBeTrue();
    expect(ac.overlayVisible)
      .withContext('panel must STAY OPEN after a pick (v17 [hideOnSelect]="false" parity)')
      .toBeTrue();

    ac.hide();
    tick();
  }));
});
