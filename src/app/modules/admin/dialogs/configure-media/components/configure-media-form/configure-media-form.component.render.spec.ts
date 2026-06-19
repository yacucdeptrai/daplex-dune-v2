import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ConfigureMediaComponent } from '../../configure-media.component';
import { ConfigureMediaFormComponent } from './configure-media-form.component';
import { CollectionService, ConfirmActionService, GenresService, MediaService, ProductionsService, TagsService } from '../../../../../../core/services';
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
        { provide: CollectionService, useValue: { findCollectionSuggestions: () => of([]) } },
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

  it('renders 5 external-id inputs incl. a labelled tvdb field', () => {
    const host: HTMLElement = fixture.nativeElement;
    const ids = ['tmdb', 'tvdb', 'imdb', 'anilist', 'mal'];
    for (const id of ids) {
      const input = host.querySelector(`input#external-ids-${id}`);
      expect(input).withContext(`external-ids-${id} input must render`).toBeTruthy();
    }
    const tvdbLabel = host.querySelector('label[for="external-ids-tvdb"]');
    expect(tvdbLabel).withContext('the tvdb input must have an associated <label for>').toBeTruthy();
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

    // Dirty via a REAL DOM input event on the rendered title field. A user keystroke is a DOM event
    // INSIDE the projected content, so it marks the OnPush <app-vertical-tab> dirty up the tree and its
    // @if(toast.visible) re-renders the footer. A programmatic setValue flips updateMediaFormChanged but
    // does NOT mark the OnPush parent, so the projected toast never materializes in the bed (it does live).
    const titleInput = host.querySelector('input#title') as HTMLInputElement;
    expect(titleInput).withContext('title field must render in the child form').toBeTruthy();
    titleInput.value = 'Edited By QA';
    titleInput.dispatchEvent(new Event('input'));
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

    // Dirty via a real DOM input event (marks the OnPush vertical-tab dirty so the footer projects).
    const titleInput = host.querySelector('input#title') as HTMLInputElement;
    expect(titleInput).withContext('title field must render in the child form').toBeTruthy();
    titleInput.value = 'Temp Edit';
    titleInput.dispatchEvent(new Event('input'));
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
