import { ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ContinueWatchingRowComponent } from './continue-watching-row.component';
import { TimeLeftPipe } from './time-left.pipe';
import { HistoryCardComponent } from '../../../users/components/history-card/history-card.component';
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
      // Keep the shared card out of the row's *logic* assertions (its own DI tree is tested below, un-stubbed).
      .overrideComponent(HistoryCardComponent, { set: { template: '<div class="card-stub"></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ContinueWatchingRowComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests in-progress history exactly once on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('history') && r.params.get('inProgress') === 'true');
    expect(req.request.params.get('limit')).toBe('12');
    req.flush({ results: [], hasNextPage: false, totalResults: 0 });
  });

  it('reserves a placeholder card row while loading, before data resolves (CLS)', () => {
    fixture.detectChanges(); // request in flight, not yet flushed → loading branch
    const section = fixture.nativeElement.querySelector('section');
    expect(section).withContext('rail section is present while loading').not.toBeNull();
    const placeholders = fixture.nativeElement.querySelectorAll('[aria-hidden="true"]');
    expect(placeholders.length).withContext('one reserved row of placeholder cells').toBe(6);
    expect(fixture.nativeElement.querySelector('app-history-card')).withContext('no real cards yet').toBeNull();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({ results: [], hasNextPage: false, totalResults: 0 });
  });

  it('swaps placeholders for cards on resolve with the section retained (no re-collapse)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')], hasNextPage: false, totalResults: 1
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[aria-hidden="true"]').length).withContext('placeholders gone').toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-history-card').length).toBe(1);
  });

  it('renders a card + resume meta per in-progress item when signed in', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.endsWith('history'));
    req.flush({
      results: [makeHistory('a', { episode: { epNumber: 3, runtime: 1500 } as HistoryGroupable['episode'] }), makeHistory('b')],
      hasNextPage: false,
      totalResults: 2
    });
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-history-card');
    expect(cards.length).toBe(2);
    const heading = fixture.nativeElement.querySelector('#continue-watching-heading');
    expect(heading).withContext('labelled Continue Watching heading').not.toBeNull();
    // Empty test transloco loader echoes keys; assert the structural label + episode number resolve.
    const metaText = fixture.nativeElement.textContent as string;
    expect(metaText).toContain('home.mediaList.resume'); // resume label key rendered
    expect(metaText).toContain('media.episode.episodePrefix 3'); // tv episode label + number
    expect(metaText).toContain('22:30'); // remaining for ep: 1500 - 150 = 1350s
  });

  it('omits the rail entirely when there are no in-progress items (AC5)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({ results: [], hasNextPage: false, totalResults: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-history-card')).toBeNull();
  });
});

// Un-stubbed render: proves the rail provides every DI token the REAL HistoryCardComponent
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
    }).compileComponents(); // HistoryCardComponent NOT stubbed

    await TestBed.inject(TranslocoService).load('en').toPromise();

    fixture = TestBed.createComponent(ContinueWatchingRowComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renders the real card with no NG injector error (NG0201 guard)', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')],
      hasNextPage: false,
      totalResults: 1
    });
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-history-card');
    expect(cards.length).withContext('real card mounted (DI scope satisfied)').toBe(1);
    // The card's resume link is the proof its template actually rendered, not a dead host node.
    expect(fixture.nativeElement.querySelector('app-history-card a[href]')).not.toBeNull();
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it('gives the card link a visible focus ring + the progress bar an accessible name with no aria-level', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.endsWith('history')).flush({
      results: [makeHistory('a')], hasNextPage: false, totalResults: 1
    });
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('app-history-card a') as HTMLAnchorElement;
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

    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector('app-history-card a[href]');
    const describedBy = link?.getAttribute('aria-describedby');
    expect(describedBy).withContext('card link is described by the rail meta line').toBe('resume-meta-a');
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
