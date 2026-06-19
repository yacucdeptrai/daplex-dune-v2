import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ResumeCardComponent } from './resume-card.component';
import { HistoryGroupable } from '../../../../../core/models';
import { AuthService, DestroyService } from '../../../../../core/services';
import {
  HTTP_TEST_PROVIDERS,
  provideMockActivatedRoute,
  provideTranslocoTesting
} from '../../../../../../testing/test-helpers';

function makeHistory(over: Partial<HistoryGroupable> = {}): HistoryGroupable {
  return {
    _id: 'h1',
    media: { _id: 'm1', title: 'The Movie', runtime: 600 } as HistoryGroupable['media'],
    time: 150,
    date: '2026-06-19',
    groupByDate: '2026-06-19',
    paused: false,
    watched: 0,
    ...over
  } as HistoryGroupable;
}

// Host supplies the rail's component-scoped DestroyService (the NG0201 boundary) plus the
// `[history]` input, mirroring how ContinueWatchingRowComponent composes the card.
@Component({
  imports: [ResumeCardComponent],
  providers: [DestroyService],
  template: '<app-resume-card [history]="history" resumeMetaId="meta-1"></app-resume-card>'
})
class HostComponent {
  history: HistoryGroupable = makeHistory();
}

describe('ResumeCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  afterEach(() => fixture?.destroy()); // tear down so randomized spec order can't leak card DOM

  async function setup(history: HistoryGroupable, translation: Record<string, unknown> = {}) {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        ...HTTP_TEST_PROVIDERS,
        provideTranslocoTesting(translation),
        provideRouter([]),
        provideMockActivatedRoute(),
        { provide: AuthService, useValue: { currentUser$: of(null), currentUser: null } }
      ]
    }).compileComponents();

    if (Object.keys(translation).length) {
      await TestBed.inject(TranslocoService).load('en').toPromise();
    }

    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.history = history;
    fixture.detectChanges();
  }

  it('renders a full-bleed 16:9 backdrop with a portrait 2:3 poster inset', async () => {
    await setup(makeHistory());
    expect(fixture.nativeElement.querySelector('.tw-aspect-w-16.tw-aspect-h-9')).withContext('16:9 backdrop box').not.toBeNull();
    expect(fixture.nativeElement.querySelector('.resume-card__poster .tw-aspect-w-2.tw-aspect-h-3'))
      .withContext('2:3 poster inset layered on the backdrop').not.toBeNull();
  });

  it('renders a visible Resume CTA that is NOT a separate interactive (single tab stop)', async () => {
    await setup(makeHistory(), { home: { mediaList: { resume: 'Resume', timeLeft: 'left' } } });
    const cta = fixture.nativeElement.querySelector('.resume-card__cta') as HTMLElement;
    expect(cta).withContext('visible Resume CTA').not.toBeNull();
    expect(cta.textContent).toContain('Resume');
    // The CTA is a styled span inside the link, never a nested <button>/<a> (no interactive nesting).
    expect(cta.tagName.toLowerCase()).withContext('CTA is a span, not a button').toBe('span');
    const link = fixture.nativeElement.querySelector('a[href]') as HTMLAnchorElement;
    expect(link.contains(cta)).withContext('CTA lives inside the single card link').toBeTrue();
    expect(link.querySelector('button')).withContext('no interactive nested in the anchor').toBeNull();
    expect(link.querySelectorAll('a').length).withContext('no nested anchor').toBe(0);
  });

  it('uses the episode still as the landscape image for a TV item', async () => {
    const history = makeHistory({
      episode: { epNumber: 2, runtime: 1500, thumbnailStillUrl: 'still.jpg', stillPlaceholder: 'sph' } as HistoryGroupable['episode']
    });
    await setup(history);
    const card = fixture.debugElement.children[0].componentInstance as ResumeCardComponent;
    expect(card.landscapeUrl).withContext('TV → episode still').toBe('still.jpg');
    expect(card.landscapePlaceholder).toBe('sph');
  });

  it('uses the media backdrop as the landscape image for a movie', async () => {
    const history = makeHistory({
      media: { _id: 'm1', title: 'The Movie', runtime: 600, thumbnailBackdropUrl: 'bd.jpg', backdropPlaceholder: 'bph' } as HistoryGroupable['media']
    });
    await setup(history);
    const card = fixture.debugElement.children[0].componentInstance as ResumeCardComponent;
    expect(card.landscapeUrl).withContext('movie → media backdrop').toBe('bd.jpg');
    expect(card.landscapePlaceholder).toBe('bph');
  });

  it('falls back to the poster-framed image when neither still nor backdrop is present', async () => {
    const history = makeHistory({
      media: { _id: 'm1', title: 'The Movie', runtime: 600, thumbnailPosterUrl: 'poster.jpg' } as HistoryGroupable['media']
    });
    await setup(history);
    const card = fixture.debugElement.children[0].componentInstance as ResumeCardComponent;
    expect(card.landscapeUrl).withContext('no landscape source → fallback path').toBeUndefined();
    // The poster image renders inside the 16:9 box (top-anchored) as the graceful fallback.
    const img = fixture.nativeElement.querySelector('img.tw-object-top') as HTMLImageElement;
    expect(img).withContext('poster framed into the 16:9 box').not.toBeNull();
    expect(img.getAttribute('alt')).withContext('decorative backdrop image').toBe('');
  });

  it('marks BOTH card images decorative (alt="") so the title is not announced per image (WCAG 1.1.1)', async () => {
    const history = makeHistory({
      media: { _id: 'm1', title: 'The Movie', runtime: 600, thumbnailBackdropUrl: 'bd.jpg', thumbnailPosterUrl: 'poster.jpg' } as HistoryGroupable['media']
    });
    await setup(history, { home: { mediaList: { resume: 'Resume', timeLeft: 'left' } } });
    const imgs = Array.from(fixture.nativeElement.querySelectorAll('img')) as HTMLImageElement[];
    expect(imgs.length).withContext('backdrop + poster inset').toBe(2);
    imgs.forEach(img => expect(img.getAttribute('alt')).withContext('decorative image').toBe(''));
    // The link still carries a non-empty accessible name from its visible title text (inside the anchor).
    const link = fixture.nativeElement.querySelector('a[href]') as HTMLAnchorElement;
    expect(link.textContent?.trim()).withContext('link accessible name survives alt=""').toContain('The Movie');
  });

  it('computes the progress value as time / runtime * 100 (episode runtime wins for TV)', async () => {
    const history = makeHistory({
      time: 750,
      episode: { epNumber: 1, runtime: 1500 } as HistoryGroupable['episode']
    });
    await setup(history);
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar).not.toBeNull();
    // 750 / 1500 * 100 = 50
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('falls through a zero episode runtime to the media runtime (no NaN in the bar)', async () => {
    const history = makeHistory({
      time: 300,
      media: { _id: 'm1', title: 'The Show', runtime: 600 } as HistoryGroupable['media'],
      episode: { epNumber: 1, runtime: 0 } as HistoryGroupable['episode']
    });
    await setup(history);
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    // 0 episode runtime → media runtime (600); 300 / 600 * 100 = 50, never Infinity/NaN.
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('guards aria-valuenow to 0 when no positive runtime is available (no Infinity/NaN)', async () => {
    const history = makeHistory({
      time: 300,
      media: { _id: 'm1', title: 'Bad Data', runtime: 0 } as HistoryGroupable['media']
    });
    await setup(history);
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-valuenow')).withContext('division-by-zero guarded').toBe('0');
  });

  it('points the resume link at /watch with the saved episode + time query params', async () => {
    const history = makeHistory({
      time: 150,
      episode: { epNumber: 4, runtime: 1500 } as HistoryGroupable['episode']
    });
    await setup(history);
    const link = fixture.nativeElement.querySelector('a[href]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toContain('/watch/m1');
    expect(link.getAttribute('href')).toContain('ep=4');
    expect(link.getAttribute('href')).toContain('t=150');
  });

  it('resolves the progress bar aria-label to "Watch progress" (i18n, not the raw key)', async () => {
    await setup(makeHistory(), { media: { actions: { watchProgress: 'Watch progress' } } });
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.getAttribute('aria-label')).toBe('Watch progress');
    expect(bar.hasAttribute('aria-level')).withContext('invalid aria-level stripped').toBeFalse();
  });

  it('exposes title + Episode N · mm:ss-left + the Resume CTA via the meta id', async () => {
    const history = makeHistory({
      time: 150,
      episode: { epNumber: 3, runtime: 1500 } as HistoryGroupable['episode']
    });
    await setup(history, { home: { mediaList: { resume: 'Resume', timeLeft: 'left' } }, media: { episode: { episodePrefix: 'Episode' } } });
    const meta = fixture.nativeElement.querySelector('#meta-1') as HTMLElement;
    expect(meta).withContext('meta block carries the describedby id').not.toBeNull();
    expect(meta.textContent).toContain('The Movie'); // title
    expect(meta.textContent).toContain('Episode 3');
    expect(meta.textContent).toContain('22:30'); // 1500 - 150 = 1350s left
    expect(meta.textContent).toContain('Resume'); // the in-link CTA is part of the description
  });

  it('keeps the quick-actions menu trigger keyboard-reachable (focus-visible, not hover-only)', async () => {
    await setup(makeHistory());
    const menuBtn = fixture.nativeElement.querySelector('button[aria-label="Toggle history menu"]') as HTMLButtonElement;
    expect(menuBtn).not.toBeNull();
    // Revealed on group hover AND keyboard focus-within (WCAG 2.1.1), with a focus ring.
    expect(menuBtn.className).toContain('group-hover:tw-visible');
    expect(menuBtn.className).withContext('keyboard reveal, not hover-only').toContain('group-focus-within:tw-visible');
    expect(menuBtn.className).toContain('focus-visible:!tw-shadow-focus-box');
  });
});
