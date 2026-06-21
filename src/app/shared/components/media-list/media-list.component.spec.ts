import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoService, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { of, throwError, Subject } from 'rxjs';

import { MediaListComponent } from './media-list.component';
import { AuthService, HistoryService, WatchProgressService } from '../../../core/services';
import { History, Media } from '../../../core/models';
import { APP_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER, AppOverlayOrigin } from '../../directives/overlay-panel/overlay-panel/overlay-panel.directive';
import { mockDialogService, mockRouter, mockTranslocoService, provideTranslocoTesting } from '../../../../testing/test-helpers';

describe('MediaListComponent', () => {
  let component: MediaListComponent;
  let fixture: ComponentFixture<MediaListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MediaListComponent],
    providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: { currentUser: null } },
        { provide: WatchProgressService, useValue: { progressFor: () => null } }
    ]
})
      // DialogService is a component-level provider; replace the whole provider set and blank
      // the template in the SAME `set` (mixing `set` with `add`/`remove` is not allowed).
      .overrideComponent(MediaListComponent, {
        set: {
          template: '',
          providers: [
            { provide: DialogService, useValue: mockDialogService() },
            { provide: HistoryService, useValue: { markWatched: () => of(null) } },
            { provide: TRANSLOCO_SCOPE, useValue: 'media' }
          ]
        }
      })
      .compileComponents();
    fixture = TestBed.createComponent(MediaListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('MediaListComponent progress overlay (W2.2)', () => {
  const media = (id: string): Media =>
    ({ _id: id, title: `T-${id}`, runtime: 100, releaseDate: { year: 2020 }, type: 1 } as unknown as Media);

  async function render(progress: Record<string, number | null>) {
    const progressFor = jasmine.createSpy('progressFor').and.callFake((id: string) => progress[id] ?? null);

    await TestBed.configureTestingModule({
      imports: [MediaListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        APP_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
        { provide: AuthService, useValue: { currentUser: { _id: 'u1' } } },
        { provide: WatchProgressService, useValue: { progressFor } },
        // Real nested media tree so the aria-label key RESOLVES to text (not the raw key).
        ...provideTranslocoTesting({ media: { actions: { watchProgress: 'Watch progress' } } })
      ]
    })
      .overrideComponent(MediaListComponent, {
        set: { providers: [{ provide: DialogService, useValue: mockDialogService() }, { provide: HistoryService, useValue: { markWatched: () => of(null) } }, { provide: TRANSLOCO_SCOPE, useValue: 'media' }] }
      })
      .compileComponents();

    // Load translations before first detectChanges so resolved text (not the raw key) renders.
    await TestBed.inject(TranslocoService).load('en').toPromise();

    const fixture = TestBed.createComponent(MediaListComponent);
    fixture.componentInstance.viewMode = 1;
    fixture.componentInstance.mediaList = [media('m1'), media('m2')];
    fixture.detectChanges();
    return fixture;
  }

  it('renders a progress bar only for the in-progress poster, with the resolved aria-label and percent', async () => {
    const fixture = await render({ m1: 42, m2: null });
    const bars = fixture.nativeElement.querySelectorAll('p-progressbar');
    // Exactly one overlay: m1 has progress, m2 does not.
    expect(bars.length).toBe(1);
    // aria-label must be the RESOLVED text, not the raw key (the W2.1 regression).
    expect(bars[0].getAttribute('aria-label')).toBe('Watch progress');
    expect(bars[0].textContent).toContain('42');
  });

  it('renders no overlay when no poster has progress', async () => {
    const fixture = await render({ m1: null, m2: null });
    expect(fixture.nativeElement.querySelectorAll('p-progressbar').length).toBe(0);
  });
});

describe('MediaListComponent mark-watched (W0.9)', () => {
  // Full enough for the hover overlay template (shortDate needs y/m/d; movie skips the tv.* branch).
  const media = (id: string): Media =>
    ({
      _id: id, title: `T-${id}`, runtime: 100, type: 1,
      releaseDate: { year: 2020, month: 1, day: 1 },
      ratingAverage: 8, views: 10, overview: 'o', genres: []
    } as unknown as Media);

  async function setup(opts: {
    currentUser?: unknown;
    markWatched?: jasmine.Spy;
  } = {}) {
    const markWatched = opts.markWatched ?? jasmine.createSpy('markWatched').and.returnValue(of(null));
    const router = mockRouter();

    await TestBed.configureTestingModule({
      imports: [MediaListComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        APP_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER,
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { currentUser: 'currentUser' in opts ? opts.currentUser : { _id: 'u1' } } },
        { provide: WatchProgressService, useValue: { progressFor: () => null } },
        ...provideTranslocoTesting({ media: { actions: { markWatched: 'Mark watched', unmarkWatched: 'Unmark watched' } } })
      ]
    })
      .overrideComponent(MediaListComponent, {
        set: {
          providers: [
            { provide: DialogService, useValue: mockDialogService() },
            { provide: HistoryService, useValue: { markWatched } },
            { provide: TRANSLOCO_SCOPE, useValue: 'media' }
          ]
        }
      })
      .compileComponents();

    await TestBed.inject(TranslocoService).load('en').toPromise();

    const fixture = TestBed.createComponent(MediaListComponent);
    fixture.componentInstance.mediaList = [media('m1')];
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, markWatched, router };
  }

  // Opens the hover overlay (where the action bar lives) and returns its toggle button from the CDK portal.
  async function openToggle(fixture: ComponentFixture<MediaListComponent>): Promise<HTMLButtonElement | null> {
    const origin = fixture.debugElement.query(By.directive(AppOverlayOrigin)).injector.get(AppOverlayOrigin);
    origin.overlayData = fixture.componentInstance.mediaList![0];
    origin.show(0);
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
    return document.querySelector<HTMLButtonElement>('.cdk-overlay-container button[aria-pressed]');
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach(el => el.remove());
  });

  it('renders the mark-watched toggle in the overlay action bar with aria-pressed "false" when unmarked', async () => {
    const { fixture } = await setup();
    const btn = await openToggle(fixture);
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute('aria-pressed')).toBe('false');
    expect(btn!.getAttribute('aria-label')).toBe('Mark watched: T-m1');
    expect(btn!.querySelector('.ms-check-circle-outline')).toBeTruthy();
  });

  it('reflects aria-pressed "true" and the filled icon after marking', async () => {
    const { fixture, component } = await setup();
    component.toggleWatched(media('m1'));
    fixture.detectChanges();
    const btn = await openToggle(fixture);
    expect(btn!.getAttribute('aria-pressed')).toBe('true');
    expect(btn!.getAttribute('aria-label')).toBe('Unmark watched: T-m1');
    expect(btn!.querySelector('.ms-check-circle')).toBeTruthy();
  });

  it('marks then unmarks: one PATCH per click with the flipped watched value, and isWatched tracks it', async () => {
    const { component, markWatched } = await setup();
    expect(component.isWatched('m1')).toBe(false);

    component.toggleWatched(media('m1'));
    expect(markWatched).toHaveBeenCalledWith('m1', { watched: 1 });
    expect(component.isWatched('m1')).toBe(true);

    component.toggleWatched(media('m1'));
    expect(markWatched).toHaveBeenCalledWith('m1', { watched: 0 });
    expect(component.isWatched('m1')).toBe(false);
    expect(markWatched).toHaveBeenCalledTimes(2);
  });

  it('rolls back the optimistic flip when the PATCH errors (no manual toast — interceptor owns it)', async () => {
    const markWatched = jasmine.createSpy('markWatched').and.returnValue(throwError(() => new Error('boom')));
    const { component } = await setup({ markWatched });
    component.toggleWatched(media('m1'));
    expect(component.isWatched('m1')).toBe(false);
  });

  it('stale rollback does not clobber a newer flip: first click errors AFTER a second toggles back', async () => {
    // Two in-flight PATCHes; the first resolves (errors) last.
    const first = new Subject<History | null>();
    const second = new Subject<History | null>();
    const markWatched = jasmine.createSpy('markWatched').and.returnValues(first, second);
    const { component } = await setup({ markWatched });

    component.toggleWatched(media('m1')); // mark   → optimistic true, before = {}
    component.toggleWatched(media('m1')); // unmark → optimistic false, before = {m1}
    expect(component.isWatched('m1')).toBe(false);

    first.error(new Error('boom'));       // late error from the FIRST click
    // Must restore the FIRST click's snapshot ({}), not re-add m1 over the second flip.
    expect(component.isWatched('m1')).toBe(false);
    second.complete();
  });

  it('anonymous: routes to /sign-in and issues no history call', async () => {
    const { component, markWatched, router } = await setup({ currentUser: null });
    component.toggleWatched(media('m1'));
    expect(router.navigate).toHaveBeenCalledWith(['/sign-in']);
    expect(markWatched).not.toHaveBeenCalled();
    expect(component.isWatched('m1')).toBe(false);
  });
});
