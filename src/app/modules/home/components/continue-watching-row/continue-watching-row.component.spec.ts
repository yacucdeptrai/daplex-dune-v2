import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ContinueWatchingRowComponent } from './continue-watching-row.component';
import { TimeLeftPipe } from './time-left.pipe';
import { ResumeCardComponent } from './resume-card/resume-card.component';
import { HistoryGroupable } from '../../../../core/models';
import { AuthService } from '../../../../core/services';
import {
  HTTP_TEST_PROVIDERS,
  provideMockActivatedRoute,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

function makeHistory(id: string, over: Partial<HistoryGroupable> = {}): HistoryGroupable {
  return {
    _id: id,
    media: { _id: `m-${id}`, title: `Title ${id}`, runtime: 600 } as HistoryGroupable['media'],
    time: 150,
    date: '2026-06-19',
    groupByDate: '2026-06-19',
    paused: false,
    watched: 0,
    ...over
  } as HistoryGroupable;
}

describe('ContinueWatchingRowComponent', () => {
  let fixture: ComponentFixture<ContinueWatchingRowComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinueWatchingRowComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        provideTranslocoTesting(),
        provideRouter([]),
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } }
      ]
    })
      // Keep the rail card out of the row's *logic* assertions (its own DI tree is tested below, un-stubbed).
      .overrideComponent(ResumeCardComponent, { set: { template: '<div class="card-stub"></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ContinueWatchingRowComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy(); // tear down DOM/subscriptions so randomized spec order can't leak nodes
  });

  it('requests in-progress history exactly once on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('history') && r.params.get('inProgress') === 'true');
    expect(req.request.params.get('limit')).toBe('12');
    req.flush({ results: [], hasNextPage: false, totalResults: 0 });
  });

  it('reserves a 3-card placeholder row while loading, before data resolves (CLS)', () => {
    fixture.detectChanges(); // request in flight, not yet flushed → loading branch
    const section = fixture.nativeElement.querySelector('section');
    expect(section).withContext('rail section is present while loading').not.toBeNull();
    const placeholders = fixture.nativeElement.querySelectorAll('[data-skeleton]');
    expect(placeholders.length).withContext('skeleton reserves the capped 3-card height').toBe(3);
    expect(fixture.nativeElement.querySelector('app-resume-card')).withContext('no real cards yet').toBeNull();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({ results: [], hasNextPage: false, totalResults: 0 });
  });

  it('swaps placeholders for cards on resolve with the section retained (no re-collapse)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')], hasNextPage: false, totalResults: 1
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[data-skeleton]').length).withContext('placeholders gone').toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-resume-card').length).toBe(1);
  });

  it('renders one resume card per in-progress item in a single horizontal row when signed in', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('history'));
    req.flush({
      results: [makeHistory('a', { episode: { epNumber: 3, runtime: 1500 } as HistoryGroupable['episode'] }), makeHistory('b')],
      hasNextPage: false,
      totalResults: 2
    });
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-resume-card');
    expect(cards.length).toBe(2);
    const heading = fixture.nativeElement.querySelector('#continue-watching-heading');
    expect(heading).withContext('labelled Continue Watching heading').not.toBeNull();
    // Single-row scroller, not a wrapping grid (AC2).
    const row = fixture.nativeElement.querySelector('.tw-overflow-x-auto');
    expect(row).withContext('horizontally scrollable rail row').not.toBeNull();
  });

  it('collapses a TV show to one card — its most-recently-watched episode (date-desc first)', () => {
    fixture.detectChanges();
    // Recency-sorted list: two in-progress episodes of show m-show, ep3 first (most recent).
    const ep3 = makeHistory('h1', {
      media: { _id: 'm-show', title: 'The Show', runtime: 600 } as HistoryGroupable['media'],
      episode: { epNumber: 3, runtime: 1500 } as HistoryGroupable['episode']
    });
    const ep2 = makeHistory('h2', {
      media: { _id: 'm-show', title: 'The Show', runtime: 600 } as HistoryGroupable['media'],
      episode: { epNumber: 2, runtime: 1500 } as HistoryGroupable['episode']
    });
    const movie = makeHistory('h3', { media: { _id: 'm-movie', title: 'A Movie', runtime: 600 } as HistoryGroupable['media'] });
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [ep3, ep2, movie], hasNextPage: false, totalResults: 3
    });
    fixture.detectChanges();

    // One card for the show (its most-recent ep3), plus the movie → 2 cards, not 3.
    expect(fixture.nativeElement.querySelectorAll('app-resume-card').length).withContext('show deduped to one card').toBe(2);
    const kept = fixture.componentInstance.results();
    expect(kept.length).toBe(2);
    expect(kept[0].episode?.epNumber).withContext('kept the most-recent episode of the show').toBe(3);
    expect(kept[1].media._id).toBe('m-movie');
  });

  it('caps the rail at 3 cards AFTER dedup (a generous fetch still yields at most 3)', () => {
    fixture.detectChanges();
    // Five distinct media — more than the cap; dedup is a no-op here, slice trims to 3.
    const five = Array.from({ length: 5 }, (_, i) =>
      makeHistory(`h${i}`, { media: { _id: `m-${i}`, title: `T${i}`, runtime: 600 } as HistoryGroupable['media'] }));
    httpMock.expectOne(r => r.url.endsWith('history')).flush({ results: five, hasNextPage: false, totalResults: 5 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-resume-card').length).withContext('capped at 3').toBe(3);
    expect(fixture.componentInstance.results().map(h => h.media._id)).toEqual(['m-0', 'm-1', 'm-2']);
  });

  it('omits the rail entirely when there are no in-progress items (AC9)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({ results: [], hasNextPage: false, totalResults: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-resume-card')).toBeNull();
  });
});

// Un-stubbed render: proves the rail provides every DI token the REAL ResumeCardComponent
// needs (it injects a component-scoped DestroyService) — a broken scope throws NG0201 here,
// yielding zero card nodes + an ErrorHandler hit. The stubbed suite above can't catch that.
describe('ContinueWatchingRowComponent (real card, DI scope)', () => {
  let fixture: ComponentFixture<ContinueWatchingRowComponent>;
  let httpMock: HttpTestingController;
  let errorHandler: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {
    errorHandler = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', ['handleError']);
    await TestBed.configureTestingModule({
      imports: [ContinueWatchingRowComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        // Real media tree so the card's progress-bar aria-label resolves to text.
        provideTranslocoTesting({ media: { actions: { watchProgress: 'Watch progress' } } }),
        provideRouter([]),
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } },
        { provide: ErrorHandler, useValue: errorHandler }
      ]
    }).compileComponents(); // ResumeCardComponent NOT stubbed

    await TestBed.inject(TranslocoService).load('en').toPromise();

    fixture = TestBed.createComponent(ContinueWatchingRowComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    fixture.destroy(); // tear down DOM/subscriptions so randomized spec order can't leak nodes
  });

  it('renders the real card with no NG injector error (NG0201 guard)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')],
      hasNextPage: false,
      totalResults: 1
    });
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-resume-card');
    expect(cards.length).withContext('real card mounted (DI scope satisfied)').toBe(1);
    // The card's resume link is the proof its template actually rendered, not a dead host node.
    expect(fixture.nativeElement.querySelector('app-resume-card a[href]')).not.toBeNull();
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it('gives the card link a visible focus ring + the progress bar an accessible name with no aria-level', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')], hasNextPage: false, totalResults: 1
    });
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('app-resume-card a') as HTMLAnchorElement;
    expect(link.className).withContext('keyboard focus ring (WCAG 2.4.7)').toContain('focus-visible:tw-shadow-focus-box');
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar).withContext('progress bar rendered').not.toBeNull();
    expect(bar.getAttribute('aria-label')).withContext('accessible name (i18n key resolved)').toBe('Watch progress');
    expect(bar.hasAttribute('aria-level')).withContext('invalid aria-level stripped').toBeFalse();
  });

  it('exposes the resume context to the card link via aria-describedby (WCAG 2.4.6)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a', { episode: { epNumber: 3, runtime: 1500 } as HistoryGroupable['episode'] })],
      hasNextPage: false,
      totalResults: 1
    });
    fixture.detectChanges();

    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('app-resume-card a[href]');
    const describedBy = link?.getAttribute('aria-describedby');
    expect(describedBy).withContext('card link is described by its resume meta line').toBe('resume-meta-a');
    const meta = fixture.nativeElement.querySelector(`#${describedBy}`);
    expect(meta).not.toBeNull();
    // The associated description carries the resume context, not just the title.
    expect(meta.textContent).toContain('media.episode.episodePrefix 3');
    expect(meta.textContent).toContain('22:30'); // 1500 - 150 = 1350s left
  });
});

describe('TimeLeftPipe', () => {
  const pipe = new TimeLeftPipe();

  it('formats remaining time as mm:ss from runtime - time', () => {
    expect(pipe.transform(150, 600)).toBe('7:30'); // 450s remaining
    expect(pipe.transform(0, 65)).toBe('1:05');
  });

  it('clamps to 0:00 when already past runtime', () => {
    expect(pipe.transform(700, 600)).toBe('0:00');
  });
});
