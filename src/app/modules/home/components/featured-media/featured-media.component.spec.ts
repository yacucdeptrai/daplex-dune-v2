import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';

import { FeaturedMediaComponent } from './featured-media.component';
import { AuthService } from '../../../../core/services';
import { Media } from '../../../../core/models';
import {
  mockRouter,
  mockDialogService,
  mockTranslocoService,
  provideTranslocoTesting
} from '../../../../../testing/test-helpers';

function makeMedia(id: string): Media {
  return {
    _id: id,
    title: `Title ${id}`,
    overview: 'overview',
    runtime: 90,
    genres: [],
    releaseDate: { year: 2020, month: 1, day: 1 },
    smallPosterUrl: `small-${id}`,
    thumbnailPosterUrl: `thumb-${id}`,
    posterUrl: `poster-${id}`,
    posterPlaceholder: 'placeholder'
  } as unknown as Media;
}

describe('FeaturedMediaComponent', () => {
  let component: FeaturedMediaComponent;
  let fixture: ComponentFixture<FeaturedMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedMediaComponent],
      providers: [
        { provide: Router, useValue: mockRouter() },
        { provide: DialogService, useValue: mockDialogService() },
        { provide: TranslocoService, useValue: mockTranslocoService() },
        { provide: AuthService, useValue: {} }
      ]
    })
      .overrideComponent(FeaturedMediaComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(FeaturedMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('FeaturedMediaComponent (hero LCP render)', () => {
  let fixture: ComponentFixture<FeaturedMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedMediaComponent],
      providers: [
        provideTranslocoTesting(),
        provideRouter([]),
        { provide: DialogService, useValue: mockDialogService() },
        { provide: AuthService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedMediaComponent);
    fixture.componentInstance.mediaList = [makeMedia('1'), makeMedia('2')];
    fixture.detectChanges();
  });

  it('eager-loads the first slide hero poster with LCP hints', () => {
    const hero: HTMLImageElement | null = fixture.nativeElement.querySelector(
      'img[fetchpriority="high"]'
    );
    expect(hero).withContext('first-slide hero img is rendered').not.toBeNull();
    expect(hero!.getAttribute('loading')).toBe('eager');
    expect(hero!.getAttribute('decoding')).toBe('async');
    expect(hero!.getAttribute('src')).toBe('thumb-1');
    expect(hero!.getAttribute('sizes')).toBe('(min-width: 768px) 220px, 0px');
    expect(hero!.getAttribute('alt')).toBe('Title 1');
  });

  it('builds srcset from the confirmed discrete poster widths', () => {
    const hero: HTMLImageElement = fixture.nativeElement.querySelector(
      'img[fetchpriority="high"]'
    );
    const srcset = hero.getAttribute('srcset') ?? '';
    expect(srcset).toContain('small-1 250w');
    expect(srcset).toContain('thumb-1 450w');
    expect(srcset).toContain('poster-1 750w');
  });

  it('marks only the first slide high-priority (one fetchpriority image)', () => {
    const eager = fixture.nativeElement.querySelectorAll('img[fetchpriority="high"]');
    expect(eager.length).toBe(1);
  });
});
